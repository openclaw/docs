---
summary: Pontuações de prontidão de lançamento do OpenClaw para áreas do produto, integrações e fluxos de trabalho compatíveis.
title: Cartão de pontuação de maturidade
x-i18n:
    generated_at: "2026-07-02T08:01:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Painel de pontuação de maturidade

<div className="maturity-hero">
  <p className="maturity-kicker">prontidão de lançamento - gerado a partir da taxonomia + evidências de QA</p>
  <p className="maturity-hero-title">Uma visão prática do que está pronto, do que foi comprovado e do que ainda precisa de trabalho.</p>
  <p>50 superfícies - 281 áreas de capacidade - cobertura determinística mais qualidade e completude revisadas por humanos.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Navegar pelas superfícies</a> / <a href="#qa-evidence-summary">Inspecionar evidências de QA</a> / <a href="/pt-BR/maturity/taxonomy">Ler a taxonomia</a></p>
</div>

## Para que serve esta página

Use esta página para responder a uma pergunta: quais superfícies do OpenClaw são escolhas confiáveis para um lançamento, e quais evidências sustentam esse julgamento? A cobertura vem de evidências determinísticas de QA; qualidade e completude são mantidas como pontuações de maturidade revisadas.

## Visão geral

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Pontuação de maturidade</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alfa</span>
      <span>Qualidade + completude</span>
      <span>Cobertura Experimental - 4%</span>
      <span>Qualidade Alfa - 64%</span>
      <span>Completude Beta - 71%</span>
    </div>
  </div>
</div>

A cobertura é deliberadamente guiada por evidências: uma área não se torna "pronta" só porque a implementação existe. Ela não é uma entrada para a pontuação de maturidade, mas o OpenClaw busca manter a cobertura ponta a ponta acima de 90% para recursos maduros Estáveis ou melhores ao longo do tempo.

## Faixas de pontuação

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Experimental</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alfa</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Estável</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Explorador de superfícies

<a id="surface-explorer" />

As superfícies são ordenadas por nível de maturidade, completude e qualidade. O suporte LTS é mostrado ao lado de cada linha para que as opções prontas para lançamento sejam fáceis de comparar.

  <Tabs>
  <Tab title="All surfaces">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superfície</span><span>Cobertura</span><span>Qualidade</span><span>Completude</span><span>Suporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">runtime do Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>13 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">host do Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">host do Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#android-app"><span className="maturity-surface-title">app Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#ios-app"><span className="maturity-surface-title">app iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Runtime de agente</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Sessão, memória e mecanismo de contexto</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Framework de canal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Ferramentas de automação de navegador, exec e sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilidade</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Caminho do provedor OpenAI e Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplicativo web do Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Ferramentas de pesquisa na web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Segurança, autenticação, pareamento e segredos</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automação: Cron, ganchos, tarefas, sondagem</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hospedagem Docker e Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows via WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi e pequenos dispositivos Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Caminho do provedor Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Caminho do provedor Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage e BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">app complementar para macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">caminho do provedor OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Compreensão de mídia e geração de mídia</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Ferramentas de geração de imagem, vídeo e música</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Provedores de modelos locais: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Provedores hospedados de cauda longa</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voz e conversa em tempo real</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nativo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hospedagem Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canais regionais</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK de apps do OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Caminho de instalação do Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Canal de chamada de voz</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Superfícies complementares do watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">App complementar para Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planejado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">App complementar nativo para Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planejado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Core">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superfície</span><span>Cobertura</span><span>Qualidade</span><span>Completude</span><span>Suporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Runtime do Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>13 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Runtime do agente</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Sessão, memória e mecanismo de contexto</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Framework de canal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilidade</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplicativo Web do Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Segurança, autenticação, pareamento e segredos</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automação: Cron, hooks, tarefas, polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Compreensão de mídia e geração de mídia</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voz e conversa em tempo real</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Platform">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superfície</span><span>Cobertura</span><span>Qualidade</span><span>Completude</span><span>Suporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">host do Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">host do Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#android-app"><span className="maturity-surface-title">app Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#ios-app"><span className="maturity-surface-title">app iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hospedagem com Docker e Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows via WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi e pequenos dispositivos Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">app complementar para macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nativo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hospedagem com Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Caminho de instalação do Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Superfícies complementares do watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Aplicativo complementar para Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planejado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Aplicativo complementar nativo para Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planejado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Canal">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superfície</span><span>Cobertura</span><span>Qualidade</span><span>Completude</span><span>Suporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estável</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estável</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage e BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canais regionais</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Canal de chamada de voz</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Provedor e ferramenta">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superfície</span><span>Cobertura</span><span>Qualidade</span><span>Completude</span><span>Suporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Automação de navegador, exec e ferramentas de sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Caminho do provedor OpenAI e Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Ferramentas de busca na web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Caminho do provedor Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Caminho do provedor Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Caminho do provedor OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Ferramentas de geração de imagem, vídeo e música</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Provedores de modelos locais: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pt-BR/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Provedores hospedados de cauda longa</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualidade</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nenhum</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Resumo de evidências de QA

As verificações abaixo mostram quais áreas do scorecard foram exercitadas por evidências do perfil de QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Validação completa da taxonomia</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 verificações - 94 aprovadas, 2 bloqueadas</span>
    <span>0 de 281 (0%) áreas - 20 de 1675 (1,2%) recursos - 77 de 1665 (4,6%) IDs de cobertura</span>
  </div>
</div>

### Prontidão por área

Abra uma superfície para inspecionar o estado das evidências de cada categoria. A lista permanece recolhida para que a página continue útil em uma visão geral.

<AccordionGroup>
  <Accordion title="Runtime do agente - 9 áreas">
    <p className="maturity-readiness-summary">8 parcialmente revisadas / 1 precisa de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Execução de turno do agente</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 7 de 24 (29,2%)</span>
        <span>17 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtimes externos e subagentes</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 3 de 10 (30%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Execução de provedor hospedado</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 5 (20%) / 1 de 5 (20%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provedores locais e auto-hospedados</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Seleção de modelo e Runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 2 de 8 (25%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticação do provedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 4 de 17 (23,5%)</span>
        <span>13 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Streaming e progresso</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 5 de 9 (55,6%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chamadas de ferramentas e tratamento de respostas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 15 de 23 (65,2%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles de execução de ferramentas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 6 de 12 (50%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicativo Android - 7 áreas">
    <p className="maturity-readiness-summary">7 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração de conexão</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime do dispositivo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuição</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Captura de mídia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat móvel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Caminho do provedor Anthropic - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entradas de mídia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Seleção de modelo e Runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cache de prompt e contexto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticação e recuperação do provedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transporte de solicitações e semântica de turnos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automação: Cron, hooks, tarefas, polling - 6 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão / 1 parcialmente revisado</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hooks de automação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tarefas e fluxos em segundo plano</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trabalhos Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 15 (0%) / 0 de 15 (0%)</span>
        <span>15 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrada de eventos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 15 (0%) / 0 de 15 (0%)</span>
        <span>15 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 1 de 7 (14,3%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles de polling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automação de navegador, exec e ferramentas de sandbox - 3 áreas">
    <p className="maturity-readiness-summary">2 parcialmente revisados / 1 precisa de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automação de navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 8 (12,5%) / 1 de 8 (12,5%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Política de sandbox e ferramentas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Invocação e execução de ferramentas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>2 de 6 (33,3%) / 4 de 8 (50%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicativo Web do Gateway - 6 áreas">
    <p className="maturity-readiness-summary">3 precisam de revisão / 3 parcialmente revisados</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e confiança do navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversa em tempo real no navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI do navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 1 de 12 (8,3%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Console do operador</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 1 de 12 (8,3%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversas do WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 15 (0%) / 2 de 20 (10%)</span>
        <span>18 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Framework de canais - 8 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão / 4 parcialmente revisados</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ações, comandos e aprovações de canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração de canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 1 de 7 (14,3%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 5 de 27 (18,5%)</span>
        <span>22 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comportamento de threads em grupo e salas ambientes</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 4 de 11 (36,4%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso de entrada e controles de identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Anexos de mídia e dados ricos de canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrega de saída e pipeline de respostas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 8 de 21 (38,1%)</span>
        <span>13 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integridade de status e controles do operador</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Descoberta de catálogo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidade e confiança</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida e integridade do Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 26 (0%) / 0 de 26 (0%)</span>
        <span>26 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publicação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão / 2 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilidade da CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração da CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 6 (16.7%) / 1 de 6 (16.7%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerenciamento do serviço Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 1 de 7 (14.3%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração de integração inicial e autenticação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração de Plugin e canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Atualizações e upgrades</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 áreas">
    <p className="maturity-readiness-summary">6 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações de canais</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo rico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz e chamadas em tempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hospedagem com Docker e Podman - 4 áreas">
    <p className="maturity-readiness-summary">3 precisam de revisão / 1 parcialmente revisada</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox e ferramentas de agente</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operações de contêiner</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração de contêiner</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lançamento e validação de imagem</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 5 (20%) / 2 de 7 (28.6%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canais regionais - 4 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Runtime do Gateway - 13 áreas">
    <p className="maturity-readiness-summary">9 precisam de revisão / 4 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aprovações e execução remota</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticação e pareamento de dispositivos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 4 de 12 (33.3%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">APIs RPC e eventos do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 20 (0%) / 2 de 22 (9.1%)</span>
        <span>20 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integridade, diagnósticos e reparo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Superfície web hospedada</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">APIs HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 4 (25%) / 1 de 4 (25%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e descoberta de rede</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodes e capacidades remotas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidade de protocolo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Funções e permissões</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles de segurança</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conexão WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 8 (12.5%) / 1 de 8 (12.5%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 16 (0%) / 0 de 16 (0%)</span>
        <span>16 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 16 (0%) / 0 de 16 (0%)</span>
        <span>16 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Caminho do provedor Google - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime direto do Gemini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia, busca e tempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento de modelos e endpoints</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cache de prompts</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e credenciais do provedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ferramentas de geração de imagem, vídeo e música - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geração de imagens</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e descoberta de mídia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geração de música</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida e entrega de tarefas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geração de vídeos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage e BlueBubbles - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicativo iOS - 8 áreas">
    <p className="maturity-readiness-summary">8 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas e tela</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat e sessões</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comandos do dispositivo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuição</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e diagnósticos do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e compartilhamento</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notificações e segundo plano</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hospedagem Kubernetes - 4 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e Exposição</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de Vida do Cluster</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e Segredos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração da Implantação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicativo complementar para Linux - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuição do Aplicativo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat e Sessões</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Capacidades de Desktop</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conectividade do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status e Diagnósticos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Host do Gateway Linux - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Alvos de Implantação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnósticos e Reparo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime do Gateway e Controle de Serviço</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e Atualizações do Host</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso Remoto e Segurança</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Provedores de modelos locais: Ollama, vLLM, SGLang, LM Studio - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memória Local e Embeddings</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de Provedor Nativos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Segurança de Rede e Controles de Prompt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidade de Runtime Compatível com OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração, Ciclo de Vida e Diagnósticos do Provedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Provedores hospedados de cauda longa - 3 áreas">
    <p className="maturity-readiness-summary">3 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provedores de LLM Hospedados</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provedores de Mídia Hospedados</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operações do Provedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="app complementar para macOS - 8 áreas">
    <p className="maturity-readiness-summary">8 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tela</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração local</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Capacidades nativas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conexões remotas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status e configurações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz e conversa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="host do Gateway no macOS - 7 áreas">
    <p className="maturity-readiness-summary">7 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração da CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico e observabilidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida do serviço Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integração local do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Permissões e capacidades nativas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perfis e isolamento</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modo Gateway remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 áreas">
    <p className="maturity-readiness-summary">6 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Criptografia e verificação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo rico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Compreensão de mídia e geração de mídia - 6 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão / 2 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tratamento de mídia do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração de mídia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geração de mídia</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 17 (5.9%) / 1 de 19 (5.3%)</span>
        <span>18 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrada e acesso de mídia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compreensão de mídia</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 1 de 14 (7.1%)</span>
        <span>13 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrega de texto para fala</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles e aprovações nativos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows nativo - 4 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerenciamento do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rede</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Atualizações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="App complementar nativo para Windows - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessões de chat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ferramentas e permissões de desktop</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conexão com o Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instalação e atualizações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status e reparo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Caminho de instalação do Nix - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ativação e UX do app</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e estado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transferência da instalação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida do Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tempo de execução e proteções do serviço</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Caminho de provedor OpenAI e Codex - 5 áreas">
    <p className="maturity-readiness-summary">2 precisam de revisão / 3 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrada de imagem e multimodal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modelo e autenticação</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>1 de 6 (16.7%) / 4 de 9 (44.4%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Estrutura de execução nativa do Codex</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 4 de 9 (44.4%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidade de respostas e ferramentas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>1 de 4 (25%) / 2 de 5 (40%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz e áudio em tempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="SDK de apps do OpenClaw - 6 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão / 1 parcialmente revisada</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversas de agentes</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API de cliente</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eventos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso ao Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Auxiliares de recursos</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 1 de 6 (16.7%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Caminho do provedor OpenRouter - 4 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tempo de execução de chat e normalização</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 15 (0%) / 0 de 15 (0%)</span>
        <span>15 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geração de mídia e fala</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Recuperação e diagnósticos do provedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e autenticação do provedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 14 (0%) / 0 de 14 (0%)</span>
        <span>14 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9 áreas">
    <p className="maturity-readiness-summary">6 precisam de revisão / 3 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Criação e empacotamento de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins integrados</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instalação e execução de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 7 de 20 (35%)</span>
        <span>13 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aprovações de Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de provedor e ferramenta</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>1 de 6 (16.7%) / 9 de 21 (42.9%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publicação de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Teste de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 3 de 11 (27.3%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi e dispositivos Linux pequenos - 4 áreas">
    <p className="maturity-readiness-summary">4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tempo de execução do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Desempenho e diagnósticos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso remoto e autenticação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e compatibilidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Segurança, autenticação, pareamento e segredos - 6 áreas">
    <p className="maturity-readiness-summary">2 parcialmente revisadas / 4 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Política de aprovação e proteções de ferramentas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 3 de 6 (50%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controle de acesso de canais</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Higiene de credenciais e segredos</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 5 de 11 (45.5%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pareamento de dispositivo e Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticação do Gateway e acesso remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Confiança de Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sessão, memória e mecanismo de contexto - 9 áreas">
    <p className="maturity-readiness-summary">2 precisam de revisão / 7 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerenciamento de sessão e transcrição da CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mecanismo de contexto</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 4 de 7 (57.1%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prompts e contexto principais</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 3 de 8 (37.5%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Histórico entre clientes e paridade de sessão</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 2 de 5 (40%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico, manutenção e recuperação</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 4 de 10 (40%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memória</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 6 de 13 (46.2%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento de sessão</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 1 de 4 (25%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerenciamento de tokens</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisado - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 2 de 10 (20%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persistência de transcrições</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo avançado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Observabilidade - 5 áreas">
    <p className="maturity-readiness-summary">3 parcialmente revisadas / 2 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Coleta de diagnósticos</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>1 de 8 (12,5%) / 3 de 10 (30%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integridade e reparo</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>1 de 12 (8,3%) / 5 de 18 (27,8%)</span>
        <span>13 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Registro de logs</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnósticos de sessão</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exportação de telemetria</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>1 de 13 (7,7%) / 7 de 21 (33,3%)</span>
        <span>14 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrada e comandos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Execução de shell local</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Renderização e segurança da saída</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modos de runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 14 (0%) / 0 de 14 (0%)</span>
        <span>14 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerenciamento de sessão</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Voz e conversa em tempo real - 6 áreas">
    <p className="maturity-readiness-summary">6 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversa no aplicativo nativo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessões de conversa em tempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fala e transcrição</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilidade da conversa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provedores de conversa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ativação por voz e roteamento</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Canal de chamada de voz - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 lacuna de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo rico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz e chamadas em tempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="superfícies complementares do watchOS - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrega e recuperação</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuição e suporte</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aprovações executivas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notificações e respostas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI do app do relógio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ferramentas de pesquisa na Web - 4 áreas">
    <p className="maturity-readiness-summary">2 precisam de revisão / 2 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Segurança de rede</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provedores de pesquisa</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>2 de 19 (10,5%) / 2 de 19 (10,5%)</span>
        <span>17 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e diagnósticos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Disponibilidade e busca de ferramentas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>2 de 11 (18,2%) / 3 de 12 (25%)</span>
        <span>9 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e identidade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração e operações do canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roteamento e entrega de conversas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mídia e conteúdo rico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos e aprovações</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows via WSL2 - 6 áreas">
    <p className="maturity-readiness-summary">5 precisam de revisão / 1 parcialmente revisada</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Recursos / IDs de cobertura</span><span>Acompanhamento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Navegador e UI de controle</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnósticos e reparo</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada - Validação completa da taxonomia</span>
        </div>
        <span>1 de 6 (16,7%) / 3 de 8 (37,5%)</span>
        <span>5 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acesso e exposição do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida do serviço Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 lacunas de capacidade</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuração do WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Precisa de revisão - Validação completa da taxonomia</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 lacunas de capacidade</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Última atualização: 2026-06-22
