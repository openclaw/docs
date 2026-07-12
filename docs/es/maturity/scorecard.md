---
summary: Puntuaciones de preparación para el lanzamiento de OpenClaw en áreas de producto, integraciones y flujos de trabajo compatibles.
title: Cuadro de mando de madurez
x-i18n:
    generated_at: "2026-07-11T23:13:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Tabla de puntuación de madurez

<div className="maturity-hero">
  <p className="maturity-kicker">preparación para el lanzamiento: generada a partir de la taxonomía y las pruebas de control de calidad</p>
  <p className="maturity-hero-title">Una visión práctica de lo que está listo, lo que está demostrado y lo que aún necesita trabajo.</p>
  <p>50 superficies - 281 áreas de capacidad - cobertura determinista junto con calidad e integridad revisadas por personas.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Explorar superficies</a> / <a href="#qa-evidence-summary">Examinar las pruebas de control de calidad</a> / <a href="/es/maturity/taxonomy">Leer la taxonomía</a></p>
</div>

## Para qué sirve esta página

Utiliza esta página para responder a una pregunta: ¿qué superficies de OpenClaw son opciones fiables para un lanzamiento y qué pruebas respaldan esa valoración? La cobertura procede de pruebas deterministas de control de calidad; la calidad y la integridad se mantienen como puntuaciones de madurez revisadas.

## Resumen

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Puntuación de madurez</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alfa</span>
      <span>Calidad + integridad</span>
      <span>Cobertura experimental - 4%</span>
      <span>Calidad alfa - 64%</span>
      <span>Integridad beta - 71%</span>
    </div>
  </div>
</div>

La cobertura se basa deliberadamente en pruebas: un área no pasa a estar «lista» solo porque exista la implementación. No se incluye en el cálculo de la puntuación de madurez, pero OpenClaw aspira a mantener con el tiempo una cobertura integral superior al 90 % para las funcionalidades maduras con nivel Estable o superior.

## Intervalos de puntuación

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Experimental</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alfa</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Estable</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Explorador de superficies

<a id="surface-explorer" />

Las superficies se ordenan por nivel de madurez, integridad y calidad. La compatibilidad con LTS se muestra junto a cada fila para facilitar la comparación de las opciones listas para el lanzamiento.

  <Tabs>
  <Tab title="All surfaces">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Cobertura</span><span>Calidad</span><span>Completitud</span><span>Compatibilidad</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Entorno de ejecución de Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>13 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Host de Gateway en Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Host de Gateway en macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguna</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#android-app"><span className="maturity-surface-title">Aplicación para Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguna</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Aplicación para iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Entorno de ejecución del agente</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Motor de sesión, memoria y contexto</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Marco de canales</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Herramientas de automatización del navegador, ejecución y entorno aislado</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilidad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Ruta del proveedor de OpenAI y Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplicación web del Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Herramientas de búsqueda web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Seguridad, autenticación, emparejamiento y secretos</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatización: Cron, enlaces, tareas y sondeo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Alojamiento con Docker y Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows mediante WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi y dispositivos Linux pequeños</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Ruta del proveedor Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Ruta del proveedor Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage y BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Aplicación complementaria para macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Ruta del proveedor OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Comprensión y generación de contenido multimedia</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Herramientas de generación de imágenes, vídeo y música</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Proveedores de modelos locales: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Proveedores alojados de uso minoritario</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voz y conversación en tiempo real</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nativo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Alojamiento en Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canales regionales</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK de aplicaciones de OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Ruta de instalación de Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Canal de llamadas de voz</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Superficies complementarias de watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Aplicación complementaria para Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planificado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Aplicación complementaria nativa para Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planificado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Núcleo">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Soporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Entorno de ejecución del Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>13 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Entorno de ejecución del agente</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Motor de sesión, memoria y contexto</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Marco de canales</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilidad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplicación web del Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Seguridad, autenticación, emparejamiento y secretos</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatización: Cron, enlaces, tareas y sondeo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Comprensión y generación de contenido multimedia</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voz y conversación en tiempo real</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK de aplicaciones de OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Plataforma">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Soporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Host del Gateway en Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Host del Gateway en macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#android-app"><span className="maturity-surface-title">Aplicación para Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>7 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Aplicación para iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Alojamiento con Docker y Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows mediante WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi y dispositivos Linux pequeños</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Aplicación complementaria para macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nativo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Alojamiento con Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Ruta de instalación de Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Superficies complementarias de watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Aplicación complementaria para Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planificado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Aplicación complementaria nativa para Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planificado</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Canal">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Soporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Estable</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Estable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage y BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canales regionales</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Canal de llamadas de voz</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimental</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Proveedor y herramienta">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Cobertura</span><span>Calidad</span><span>Integridad</span><span>Soporte</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Automatización del navegador, ejecución y herramientas de entorno aislado</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Ruta del proveedor de OpenAI y Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parcial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Herramientas de búsqueda web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Grado de completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Ruta del proveedor Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Grado de completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Ruta del proveedor Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Grado de completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Ruta del proveedor OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Grado de completitud</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Herramientas de generación de imágenes, vídeo y música</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Grado de completitud</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Proveedores de modelos locales: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Grado de completitud</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/es/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Proveedores alojados de larga cola</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 áreas</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cobertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Calidad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Integridad</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Ninguno</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Resumen de evidencias de control de calidad

Las comprobaciones siguientes muestran qué áreas de la tabla de puntuación se evaluaron mediante evidencias del perfil de control de calidad.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Validación completa de la taxonomía</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 comprobaciones: 94 superadas, 2 bloqueadas</span>
    <span>0 de 281 (0 %) áreas - 20 de 1675 (1,2 %) funcionalidades - 77 de 1665 (4,6 %) identificadores de cobertura</span>
  </div>
</div>

### Preparación por área

  Abra una sección para inspeccionar el estado de las pruebas de cada categoría. La lista permanece contraída para que la página siga siendo útil de un vistazo.

  <AccordionGroup>
  <Accordion title="Entorno de ejecución del agente - 9 áreas">
    <p className="maturity-readiness-summary">8 revisadas parcialmente / 1 necesita revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ejecución de turnos del agente</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 7 de 24 (29.2%)</span>
        <span>17 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entornos de ejecución externos y subagentes</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 3 de 10 (30%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ejecución con proveedores alojados</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 5 (20%) / 1 de 5 (20%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Proveedores locales y autoalojados</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Selección de modelo y entorno de ejecución</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 2 de 8 (25%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticación del proveedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 4 de 17 (23.5%)</span>
        <span>13 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transmisión y progreso</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 5 de 9 (55.6%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Llamadas a herramientas y gestión de respuestas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 15 de 23 (65.2%)</span>
        <span>8 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles de ejecución de herramientas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 6 de 12 (50%)</span>
        <span>6 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicación para Android - 7 áreas">
    <p className="maturity-readiness-summary">7 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración de la conexión</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno de ejecución del dispositivo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribución</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Captura multimedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat móvil</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ruta del proveedor Anthropic - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entradas multimedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Selección de modelo y entorno de ejecución</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Caché de instrucciones y contexto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticación y recuperación del proveedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transporte de solicitudes y semántica de los turnos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatización: Cron, hooks, tareas y sondeo - 6 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión / 1 revisada parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hooks de automatización</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tareas y flujos en segundo plano</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trabajos de Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 15 (0%) / 0 de 15 (0%)</span>
        <span>15 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrada de eventos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 15 (0%) / 0 de 15 (0%)</span>
        <span>15 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 1 de 7 (14.3%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles de sondeo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatización del navegador, ejecución y herramientas de entorno aislado - 3 áreas">
    <p className="maturity-readiness-summary">2 revisadas parcialmente / 1 necesita revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automatización del navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 8 (12.5%) / 1 de 8 (12.5%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Política del entorno aislado y de las herramientas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Invocación y ejecución de herramientas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>2 de 6 (33.3%) / 4 de 8 (50%)</span>
        <span>4 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicación web del Gateway - 6 áreas">
    <p className="maturity-readiness-summary">3 necesitan revisión / 3 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso y confianza del navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversación en tiempo real desde el navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfaz de usuario del navegador</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 1 de 12 (8.3%)</span>
        <span>11 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Consola del operador</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 1 de 12 (8.3%)</span>
        <span>11 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversaciones de WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 15 (0%) / 2 de 20 (10%)</span>
        <span>18 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Marco de canales - 8 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión / 4 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comandos y aprobaciones de acciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 1 de 7 (14.3%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 5 de 27 (18.5%)</span>
        <span>22 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comportamiento de los hilos de grupo y las salas ambientales</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 4 de 11 (36.4%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles de acceso entrante y de identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Archivos multimedia adjuntos y datos enriquecidos del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canalización de entrega saliente y respuestas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 8 de 21 (38.1%)</span>
        <span>13 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Estado de salud y controles del operador</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Descubrimiento del catálogo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidad y confianza</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida y estado de los plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 26 (0%) / 0 de 26 (0%)</span>
        <span>26 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publicación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión / 2 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilidad de la CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración de la CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 6 (16.7%) / 1 de 6 (16.7%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestión del servicio Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 1 de 7 (14.3%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Incorporación y configuración de la autenticación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración de plugins y canales</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Actualizaciones y mejoras de versión</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 áreas">
    <p className="maturity-readiness-summary">6 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz y llamadas en tiempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Alojamiento con Docker y Podman - 4 áreas">
    <p className="maturity-readiness-summary">3 necesitan revisión / 1 revisada parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno aislado y herramientas del agente</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operaciones de contenedores</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración de contenedores</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publicación y validación de imágenes</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 5 (20%) / 2 de 7 (28.6%)</span>
        <span>5 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canales regionales - 4 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Entorno de ejecución del Gateway - 13 áreas">
    <p className="maturity-readiness-summary">9 necesitan revisión / 4 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aprobaciones y ejecución remota</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticación y emparejamiento de dispositivos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 4 de 12 (33.3%)</span>
        <span>8 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API RPC y eventos del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 20 (0%) / 2 de 22 (9.1%)</span>
        <span>20 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Estado, diagnóstico y reparación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfaz web alojada</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 4 (25%) / 1 de 4 (25%)</span>
        <span>3 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso y detección de red</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodos y capacidades remotas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidad del protocolo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roles y permisos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles de seguridad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conexión WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 8 (12.5%) / 1 de 8 (12.5%)</span>
        <span>7 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 16 (0%) / 0 de 16 (0%)</span>
        <span>16 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 16 (0%) / 0 de 16 (0%)</span>
        <span>16 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ruta del proveedor de Google - 5 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno de ejecución directo de Gemini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia, búsqueda y tiempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento de modelos y puntos de conexión</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Almacenamiento en caché de instrucciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y credenciales del proveedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Herramientas de generación de imágenes, vídeos y música - 5 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generación de imágenes</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y descubrimiento de contenido multimedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generación de música</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida y entrega de tareas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generación de vídeos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage y BlueBubbles - 5 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicación para iOS - 8 áreas">
    <p className="maturity-readiness-summary">8 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lienzo y pantalla</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat y sesiones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comandos del dispositivo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribución</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y diagnóstico del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y uso compartido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notificaciones y ejecución en segundo plano</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Alojamiento en Kubernetes - 4 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso y exposición</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida del clúster</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y secretos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración del despliegue</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicación complementaria para Linux - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribución de la aplicación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat y sesiones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Capacidades de escritorio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conectividad con el Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Estado y diagnóstico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Host del Gateway para Linux - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Destinos de despliegue</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico y reparación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno de ejecución del Gateway y control del servicio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y actualizaciones del host</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso remoto y seguridad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Proveedores de modelos locales: Ollama, vLLM, SGLang, LM Studio - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memoria local e incrustaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins nativos de proveedores</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Seguridad de red y controles de prompts</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidad con entornos de ejecución compatibles con OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración, ciclo de vida y diagnóstico de proveedores</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Proveedores alojados de uso minoritario - 3 áreas">
    <p className="maturity-readiness-summary">3 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Proveedores de LLM alojados</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Proveedores de contenido multimedia alojados</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operaciones de proveedores</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicación complementaria de macOS - 8 áreas">
    <p className="maturity-readiness-summary">8 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0 %) / 0 de 4 (0 %)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración local</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0 %) / 0 de 7 (0 %)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Capacidades nativas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0 %) / 0 de 5 (0 %)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conexiones remotas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0 %) / 0 de 3 (0 %)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0 %) / 0 de 5 (0 %)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Estado y configuración</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0 %) / 0 de 5 (0 %)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz y conversación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0 %) / 0 de 3 (0 %)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0 %) / 0 de 3 (0 %)</span>
        <span>3 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Host del Gateway para macOS - 7 áreas">
    <p className="maturity-readiness-summary">7 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración de la CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0 %) / 0 de 4 (0 %)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico y observabilidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0 %) / 0 de 4 (0 %)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida del servicio Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0 %) / 0 de 10 (0 %)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integración con el Gateway local</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0 %) / 0 de 9 (0 %)</span>
        <span>9 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Permisos y capacidades nativas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0 %) / 0 de 4 (0 %)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perfiles y aislamiento</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0 %) / 0 de 5 (0 %)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modo de Gateway remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0 %) / 0 de 5 (0 %)</span>
        <span>5 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 áreas">
    <p className="maturity-readiness-summary">6 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funciones / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0 %) / 0 de 7 (0 %)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0 %) / 0 de 5 (0 %)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0 %) / 0 de 1 (0 %)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cifrado y verificación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0 %) / 0 de 3 (0 %)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0 %) / 0 de 1 (0 %)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0 %) / 0 de 6 (0 %)</span>
        <span>6 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / ID de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Comprensión y generación de contenido multimedia - 6 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión / 2 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / ID de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestión de contenido multimedia del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración de contenido multimedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generación de contenido multimedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 17 (5.9%) / 1 de 19 (5.3%)</span>
        <span>18 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Recepción y acceso a contenido multimedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comprensión de contenido multimedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 1 de 14 (7.1%)</span>
        <span>13 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrega de texto a voz</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / ID de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles y aprobaciones nativos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows nativo - 4 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / ID de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestión del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Redes</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Actualizaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplicación complementaria nativa para Windows - 5 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sesiones de chat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Herramientas y permisos de escritorio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conexión al Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instalación y actualizaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Estado y reparación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ruta de instalación de Nix - 5 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Activación y experiencia de usuario de la aplicación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y estado</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transferencia de la instalación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida del Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno de ejecución y protecciones del servicio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ruta del proveedor OpenAI y Codex - 5 áreas">
    <p className="maturity-readiness-summary">2 requieren revisión / 3 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrada de imágenes y multimodal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modelo y autenticación</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 6 (16.7%) / 4 de 9 (44.4%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno de pruebas nativo de Codex</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 4 de 9 (44.4%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidad con respuestas y herramientas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 4 (25%) / 2 de 5 (40%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz y audio en tiempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="SDK de aplicaciones de OpenClaw - 6 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión / 1 revisada parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversaciones del agente</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API del cliente</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eventos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso al Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Utilidades de recursos</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 1 de 6 (16.7%)</span>
        <span>5 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ruta del proveedor OpenRouter: 4 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno de ejecución y normalización del chat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 15 (0%) / 0 de 15 (0%)</span>
        <span>15 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generación multimedia y voz</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Recuperación y diagnóstico del proveedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y autenticación del proveedor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 14 (0%) / 0 de 14 (0%)</span>
        <span>14 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins: 9 áreas">
    <p className="maturity-readiness-summary">6 necesitan revisión / 3 parcialmente revisadas</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Creación y empaquetado de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins incluidos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin de Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de canales</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instalación y ejecución de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 7 de 20 (35%)</span>
        <span>13 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aprobaciones de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de proveedores y herramientas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada: validación completa de la taxonomía</span>
        </div>
        <span>1 de 6 (16.7%) / 9 de 21 (42.9%)</span>
        <span>12 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publicación de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pruebas de plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 3 de 11 (27.3%)</span>
        <span>8 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi y dispositivos Linux pequeños: 4 áreas">
    <p className="maturity-readiness-summary">4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entorno de ejecución del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rendimiento y diagnóstico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso remoto y autenticación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y compatibilidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 12 (0%) / 0 de 12 (0%)</span>
        <span>12 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Seguridad, autenticación, emparejamiento y secretos: 6 áreas">
    <p className="maturity-readiness-summary">2 parcialmente revisadas / 4 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Política de aprobación y medidas de protección de herramientas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada: validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 3 de 6 (50%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Control de acceso a canales</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestión segura de credenciales y secretos</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parcialmente revisada: validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 5 de 11 (45.5%)</span>
        <span>6 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Emparejamiento de dispositivos y Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticación del Gateway y acceso remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Confianza en los plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sesión, memoria y motor de contexto - 9 áreas">
    <p className="maturity-readiness-summary">2 necesitan revisión / 7 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestión de sesiones y transcripciones de la CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Motor de contexto</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 4 de 7 (57.1%)</span>
        <span>3 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Indicaciones y contexto del núcleo</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 3 de 8 (37.5%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Historial entre clientes y paridad de sesiones</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 2 de 5 (40%)</span>
        <span>3 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico, mantenimiento y recuperación</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 4 de 10 (40%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memoria</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 6 de 13 (46.2%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento de sesiones</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 1 de 4 (25%)</span>
        <span>3 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestión de tokens</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 2 de 10 (20%)</span>
        <span>8 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persistencia de transcripciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 áreas">
    <p className="maturity-readiness-summary">5 necesitan revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Necesita revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Observabilidad - 5 áreas">
    <p className="maturity-readiness-summary">3 revisadas parcialmente / 2 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Recopilación de diagnósticos</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 8 (12.5%) / 3 de 10 (30%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Estado y reparación</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 12 (8.3%) / 5 de 18 (27.8%)</span>
        <span>13 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Registro</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnósticos de sesión</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exportación de telemetría</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisada parcialmente - Validación completa de la taxonomía</span>
        </div>
        <span>1 de 13 (7.7%) / 7 de 21 (33.3%)</span>
        <span>14 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrada y comandos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ejecución del shell local</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Renderizado y seguridad de la salida</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modos de ejecución</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 14 (0%) / 0 de 14 (0%)</span>
        <span>14 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestión de sesiones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Voz y conversación en tiempo real - 6 áreas">
    <p className="maturity-readiness-summary">6 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversación en la aplicación nativa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sesiones de conversación en tiempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz y transcripción</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilidad de la conversación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Proveedores de conversación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Activación por voz y enrutamiento</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Canal de llamadas de voz - 5 áreas">
    <p className="maturity-readiness-summary">5 requieren revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 1 (0%) / 0 de 1 (0%)</span>
        <span>1 carencia de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voz y llamadas en tiempo real</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Requiere revisión - Validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidades</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Superficies complementarias de watchOS: 5 áreas">
    <p className="maturity-readiness-summary">5 pendientes de revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrega y recuperación</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribución y soporte</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aprobaciones de ejecución</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notificaciones y respuestas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfaz de la aplicación para el reloj</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 3 (0%) / 0 de 3 (0%)</span>
        <span>3 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Herramientas de búsqueda web: 4 áreas">
    <p className="maturity-readiness-summary">2 pendientes de revisión / 2 revisadas parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Seguridad de red</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Proveedores de búsqueda</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente: validación completa de la taxonomía</span>
        </div>
        <span>2 de 19 (10.5%) / 2 de 19 (10.5%)</span>
        <span>17 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y diagnóstico</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 9 (0%) / 0 de 9 (0%)</span>
        <span>9 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Disponibilidad y recuperación de herramientas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente: validación completa de la taxonomía</span>
        </div>
        <span>2 de 11 (18.2%) / 3 de 12 (25%)</span>
        <span>9 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp: 5 áreas">
    <p className="maturity-readiness-summary">5 pendientes de revisión</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso e identidad</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 7 (0%) / 0 de 7 (0%)</span>
        <span>7 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración y operaciones del canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 5 (0%) / 0 de 5 (0%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enrutamiento y entrega de conversaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 4 (0%) / 0 de 4 (0%)</span>
        <span>4 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contenido multimedia y enriquecido</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controles nativos y aprobaciones</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 2 (0%) / 0 de 2 (0%)</span>
        <span>2 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows mediante WSL2: 6 áreas">
    <p className="maturity-readiness-summary">5 pendientes de revisión / 1 revisada parcialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Área</span><span>Funcionalidades / identificadores de cobertura</span><span>Seguimiento</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Navegador e interfaz de control</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 8 (0%) / 0 de 8 (0%)</span>
        <span>8 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnóstico y reparación</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisado parcialmente: validación completa de la taxonomía</span>
        </div>
        <span>1 de 6 (16.7%) / 3 de 8 (37.5%)</span>
        <span>5 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acceso y exposición del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 11 (0%) / 0 de 11 (0%)</span>
        <span>11 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo de vida del servicio Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 10 (0%) / 0 de 10 (0%)</span>
        <span>10 carencias de capacidad</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuración de WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Pendiente de revisión: validación completa de la taxonomía</span>
        </div>
        <span>0 de 6 (0%) / 0 de 6 (0%)</span>
        <span>6 carencias de capacidad</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Última actualización: 2026-06-22
