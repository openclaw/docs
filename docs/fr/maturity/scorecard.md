---
summary: Scores de préparation à la publication d’OpenClaw pour les domaines produit, les intégrations et les workflows pris en charge.
title: Tableau de score de maturité
x-i18n:
    generated_at: "2026-06-27T17:40:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 916f070ca42778dc1cc41e47cdb4ace502f073c4e888f21526b762226a856d40
    source_path: maturity/scorecard.md
    workflow: 16
---

# Tableau de maturité

<div className="maturity-hero">
  <p className="maturity-kicker">préparation à la publication - générée à partir de la taxonomie + des preuves QA</p>
  <p className="maturity-hero-title">Une vue pratique de ce qui est prêt, de ce qui est prouvé et de ce qui nécessite encore du travail.</p>
  <p>50 surfaces - 281 domaines de capacité - couverture déterministe, avec qualité et exhaustivité examinées par des humains.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Parcourir les surfaces</a> / <a href="#qa-evidence-summary">Examiner les preuves QA</a> / <a href="/fr/maturity/taxonomy">Lire la taxonomie</a></p>
</div>

## À quoi sert cette page

Utilisez cette page pour répondre à une question : quelles surfaces OpenClaw sont des choix crédibles pour une version, et quelles preuves étayent ce jugement ? La couverture provient de preuves QA déterministes ; la qualité et l’exhaustivité sont maintenues sous forme de scores de maturité examinés.

## En un coup d’œil

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">67%</span>
      <span>Score de maturité</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "67" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>Qualité + exhaustivité</span>
      <span>Couverture Expérimental - 4%</span>
      <span>Qualité Alpha - 63%</span>
      <span>Exhaustivité Bêta - 70%</span>
    </div>
  </div>
</div>

La couverture est délibérément guidée par les preuves : un domaine ne devient pas « prêt » simplement parce que l’implémentation existe. Ce n’est pas une entrée du score de maturité, mais OpenClaw vise à maintenir la couverture de bout en bout au-dessus de 90 % pour les fonctionnalités matures de niveau Stable ou supérieur au fil du temps.

## Plages de score

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Bêta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stable</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Explorateur de surfaces

<a id="surface-explorer" />

Les surfaces sont ordonnées par niveau de maturité, exhaustivité et qualité. La prise en charge LTS est affichée à côté de chaque ligne afin que les options prêtes pour une version soient faciles à comparer.

  <Tabs>
  <Tab title="Toutes les surfaces">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Surface</span><span>Couverture</span><span>Qualité</span><span>Exhaustivité</span><span>Prise en charge</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>7 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Runtime Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>13 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Hôte Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Hôte Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>7 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Runtime d’agent</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>9 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Moteur de session, de mémoire et de contexte</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>9 zones</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Framework de canal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>8 zones</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Outils d’automatisation du navigateur, d’exécution et de bac à sable</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>3 zones</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilité</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 zones</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Chemin de fournisseur OpenAI et Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 zones</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Application Web Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>6 zones</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Outils de recherche Web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>4 zones</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Sécurité, authentification, appairage et secrets</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatisation : Cron, hooks, tâches, interrogation périodique</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hébergement Docker et Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows via WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi et petits appareils Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Chemin du fournisseur Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Complet - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Complet - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Chemin du fournisseur Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage et BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Application compagnon macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Chemin du fournisseur OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Compréhension des médias et génération de médias</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Outils de génération d’images, de vidéos et de musique</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Fournisseurs de modèles locaux : Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Fournisseurs hébergés de longue traîne</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voix et conversation en temps réel</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#android-app"><span className="maturity-surface-title">Application Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>7 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows natif</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hébergement Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canaux régionaux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK d’application OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#ios-app"><span className="maturity-surface-title">application iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>8 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">chemin d’installation Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">canal d’appel vocal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">surfaces compagnes watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">application compagne Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planifié</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">application compagne Windows native</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planifié</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Cœur">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Surface</span><span>Couverture</span><span>Qualité</span><span>Exhaustivité</span><span>Prise en charge</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>7 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Environnement d’exécution Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>13 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Environnement d’exécution des agents</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>9 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Moteur de session, de mémoire et de contexte</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>9 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Infrastructure de canaux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>8 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilité</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Application Web Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>9 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Sécurité, authentification, appairage et secrets</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatisation : Cron, points d’accroche, tâches, interrogation périodique</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Compréhension des médias et génération de médias</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voix et conversation en temps réel</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Plateforme">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Surface</span><span>Couverture</span><span>Qualité</span><span>Complétude</span><span>Prise en charge</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Hôte Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Hôte Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>7 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hébergement Docker et Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows via WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi et petits appareils Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Application compagnon macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>8 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#android-app"><span className="maturity-surface-title">Application Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>7 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows natif</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hébergement Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Application iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>8 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Chemin d’installation Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Surfaces compagnon watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Application compagnon Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planifié</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Application compagnon native Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planifié</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Canal">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Surface</span><span>Couverture</span><span>Qualité</span><span>Exhaustivité</span><span>Support</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stable</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stable</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Complet - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Complet - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage et BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canaux régionaux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Canal d’appel vocal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Expérimental</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Fournisseur et outil">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Surface</span><span>Couverture</span><span>Qualité</span><span>Complétude</span><span>Support</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Automatisation du navigateur, exécution et outils de sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Complétude</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Chemin du fournisseur OpenAI et Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Partiel - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Outils de recherche Web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Chemin de fournisseur Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Chemin de fournisseur Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Chemin de fournisseur OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bêta</span></span><span>4 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bêta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Outils de génération d’images, de vidéos et de musique</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Fournisseurs de modèles locaux : Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fr/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Fournisseurs hébergés de longue traîne</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 domaines</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Couverture</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Expérimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Exhaustivité</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Aucun</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Synthèse des preuves QA

Les vérifications ci-dessous indiquent les domaines de la grille d'évaluation qui ont été exercés par les preuves du profil QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Validation complète de la taxonomie</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 vérifications - 94 réussies, 2 bloquées</span>
    <span>0 sur 281 (0 %) domaines - 20 sur 1675 (1,2 %) fonctionnalités - 77 sur 1665 (4,6 %) identifiants de couverture</span>
  </div>
</div>

### État de préparation par domaine

Ouvrez une surface pour inspecter l'état des preuves de chaque catégorie. La liste reste repliée afin que la page demeure utile d'un coup d'œil.

<AccordionGroup>
  <Accordion title="Runtime d'agent - 9 domaines">
    <p className="maturity-readiness-summary">8 partiellement examinés / 1 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / identifiants de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exécution des tours d'agent</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 7 sur 24 (29,2 %)</span>
        <span>17 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtimes externes et sous-agents</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 3 sur 10 (30 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exécution par fournisseur hébergé</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 5 (20 %) / 1 sur 5 (20 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fournisseurs locaux et auto-hébergés</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sélection du modèle et du runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 2 sur 8 (25 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Authentification du fournisseur</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 4 sur 17 (23,5 %)</span>
        <span>13 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Streaming et progression</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 5 sur 9 (55,6 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Appels d'outils et traitement des réponses</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 15 sur 23 (65,2 %)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles d'exécution des outils</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 6 sur 12 (50 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Application Android - 7 domaines">
    <p className="maturity-readiness-summary">7 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / identifiants de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration de la connexion</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime de l'appareil</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribution</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Capture de médias</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat mobile</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Paramètres</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voix</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Chemin du fournisseur Anthropic - 5 domaines">
    <p className="maturity-readiness-summary">5 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / identifiants de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrées multimédias</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sélection du modèle et du runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 12 (0 %)</span>
        <span>12 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cache de prompt et contexte</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Authentification et récupération du fournisseur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0 %) / 0 sur 9 (0 %)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transport des requêtes et sémantique des tours</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatisation : Cron, hooks, tâches, interrogation - 6 domaines">
    <p className="maturity-readiness-summary">5 à revoir / 1 partiellement revu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hooks d’automatisation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0 %) / 0 sur 11 (0 %)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tâches et flux en arrière-plan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tâches Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 15 (0 %) / 0 sur 15 (0 %)</span>
        <span>15 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrée des événements</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 15 (0 %) / 0 sur 15 (0 %)</span>
        <span>15 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 1 sur 7 (14,3 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles d’interrogation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatisation du navigateur, exécution et outils d’environnement isolé - 3 domaines">
    <p className="maturity-readiness-summary">2 partiellement revus / 1 à revoir</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automatisation du navigateur</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 8 (12,5 %) / 1 sur 8 (12,5 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Politique d’environnement isolé et d’outils</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Invocation et exécution des outils</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>2 sur 6 (33,3 %) / 4 sur 8 (50 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Application web Gateway - 6 domaines">
    <p className="maturity-readiness-summary">3 à revoir / 3 partiellement revus</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès navigateur et confiance</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversation en temps réel dans le navigateur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interface utilisateur du navigateur</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 1 sur 12 (8,3 %)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Console opérateur</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 1 sur 12 (8,3 %)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversations WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 15 (0 %) / 2 sur 20 (10 %)</span>
        <span>18 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Framework de canaux - 8 domaines">
    <p className="maturity-readiness-summary">4 à revoir / 4 partiellement revus</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Actions, commandes et approbations de canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration de canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 1 sur 7 (14,3 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 5 sur 27 (18,5 %)</span>
        <span>22 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comportement des fils de groupe et des salons ambiants</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 4 sur 11 (36,4 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès entrant et contrôles d’identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pièces jointes multimédias et données de canal enrichies</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Livraison sortante et pipeline de réponse</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 8 sur 21 (38,1 %)</span>
        <span>13 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">État de santé et contrôles opérateur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À revoir - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 domaines">
    <p className="maturity-readiness-summary">4 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Découverte du catalogue</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilité et confiance</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0 %) / 0 sur 12 (0 %)</span>
        <span>12 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cycle de vie et santé du Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 26 (0 %) / 0 sur 26 (0 %)</span>
        <span>26 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publication</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue / 2 partiellement revus</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilité de la CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration de la CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 6 (16,7 %) / 1 sur 6 (16,7 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestion du service Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 1 sur 7 (14,3 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Intégration et configuration de l’authentification</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration des Plugins et des canaux</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mises à jour et montées de version</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 domaines">
    <p className="maturity-readiness-summary">6 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations des canaux</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0 %) / 0 sur 12 (0 %)</span>
        <span>12 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles natifs et approbations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voix et appels en temps réel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hébergement Docker et Podman - 4 domaines">
    <p className="maturity-readiness-summary">3 nécessitent une revue / 1 partiellement revu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox et outillage des agents</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Opérations de conteneur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0 %) / 0 sur 11 (0 %)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration de conteneur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publication et validation des images</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 5 (20 %) / 2 sur 7 (28,6 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canaux régionaux - 4 domaines">
    <p className="maturity-readiness-summary">4 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Runtime Gateway - 13 domaines">
    <p className="maturity-readiness-summary">9 nécessitent une révision / 4 partiellement révisés</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Approbations et exécution à distance</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Authentification et appairage des appareils</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cycle de vie du Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 4 sur 12 (33,3 %)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API RPC et événements du Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 20 (0 %) / 2 sur 22 (9,1 %)</span>
        <span>20 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">État, diagnostics et réparation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Surface Web hébergée</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 4 (25 %) / 1 sur 4 (25 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès réseau et découverte</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodes et capacités à distance</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0 %) / 0 sur 8 (0 %)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilité du protocole</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rôles et autorisations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles de sécurité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connexion WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 8 (12,5 %) / 1 sur 8 (12,5 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0 %) / 0 sur 11 (0 %)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 16 (0 %) / 0 sur 16 (0 %)</span>
        <span>16 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles natifs et approbations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 16 (0 %) / 0 sur 16 (0 %)</span>
        <span>16 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Chemin du fournisseur Google - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Gemini direct</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0 %) / 0 sur 9 (0 %)</span>
        <span>9 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias, recherche et temps réel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage des modèles et points de terminaison</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mise en cache des prompts</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration du fournisseur et identifiants</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacités</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Outils de génération d’images, de vidéos et de musique - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Génération d’images</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0 %) / 0 sur 9 (0 %)</span>
        <span>9 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et découverte des médias</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Génération de musique</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cycle de vie et livraison des tâches</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0 %) / 0 sur 12 (0 %)</span>
        <span>12 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Génération de vidéos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0 %) / 0 sur 11 (0 %)</span>
        <span>11 lacunes de capacités</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage et BlueBubbles - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0 %) / 0 sur 11 (0 %)</span>
        <span>11 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles natifs et approbations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacités</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Application iOS - 8 domaines">
    <p className="maturity-readiness-summary">8 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas et écran</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat et sessions</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Commandes d’appareil</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribution</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et diagnostics du Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et partage</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notifications et arrière-plan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voix</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hébergement Kubernetes - 4 domaines">
    <p className="maturity-readiness-summary">4 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et exposition</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cycle de vie du cluster</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et secrets</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration du déploiement</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Application compagnon Linux - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribution de l'application</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0%) / 0 sur 3 (0%)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat et sessions</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0%) / 0 sur 3 (0%)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fonctionnalités de bureau</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0%) / 0 sur 9 (0%)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connectivité Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">État et diagnostics</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0%) / 0 sur 7 (0%)</span>
        <span>7 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hôte Gateway Linux - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cibles de déploiement</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0%) / 0 sur 3 (0%)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostics et réparation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Gateway et contrôle du service</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0%) / 0 sur 6 (0%)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et mises à jour de l'hôte</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès à distance et sécurité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0%) / 0 sur 6 (0%)</span>
        <span>6 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Fournisseurs de modèles locaux : Ollama, vLLM, SGLang, LM Studio - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mémoire locale et embeddings</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de fournisseurs natifs</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0%) / 0 sur 10 (0%)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sécurité réseau et contrôles des prompts</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0%) / 0 sur 2 (0%)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilité du runtime compatible avec OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0%) / 0 sur 8 (0%)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration, cycle de vie et diagnostics des fournisseurs</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0%) / 0 sur 12 (0%)</span>
        <span>12 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Fournisseurs hébergés de longue traîne - 3 domaines">
    <p className="maturity-readiness-summary">3 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fournisseurs LLM hébergés</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0%) / 0 sur 12 (0%)</span>
        <span>12 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fournisseurs de médias hébergés</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0%) / 0 sur 8 (0%)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Opérations des fournisseurs</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0%) / 0 sur 12 (0%)</span>
        <span>12 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Application compagnon macOS - 8 domaines">
    <p className="maturity-readiness-summary">8 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration locale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Capacités natives</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connexions distantes</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat distant</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">État et paramètres</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voix et conversation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacités</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hôte Gateway macOS - 7 domaines">
    <p className="maturity-readiness-summary">7 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration de la CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostics et observabilité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cycle de vie du service Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Intégration du Gateway local</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0 %) / 0 sur 9 (0 %)</span>
        <span>9 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autorisations et capacités natives</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Profils et isolation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mode Gateway distant</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacités</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 domaines">
    <p className="maturity-readiness-summary">6 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chiffrement et vérification</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacités</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles natifs et approbations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacités</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 domaines">
    <p className="maturity-readiness-summary">4 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0%) / 0 sur 1 (0%)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0%) / 0 sur 1 (0%)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0%) / 0 sur 1 (0%)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0%) / 0 sur 1 (0%)</span>
        <span>1 lacune de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Compréhension des médias et génération de médias - 6 domaines">
    <p className="maturity-readiness-summary">4 nécessitent une révision / 2 partiellement révisés</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestion des médias du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration des médias</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0%) / 0 sur 1 (0%)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Génération de médias</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 17 (5.9%) / 1 sur 19 (5.3%)</span>
        <span>18 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ingestion et accès aux médias</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0%) / 0 sur 8 (0%)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compréhension des médias</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0%) / 1 sur 14 (7.1%)</span>
        <span>13 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Livraison de la synthèse vocale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0%) / 0 sur 2 (0%)</span>
        <span>2 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0%) / 0 sur 9 (0%)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0%) / 0 sur 9 (0%)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles natifs et approbations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows natif - 4 domaines">
    <p className="maturity-readiness-summary">4 nécessitent une révision</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0%) / 0 sur 9 (0%)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestion du Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0%) / 0 sur 11 (0%)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Réseau</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mises à jour</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une révision - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Native Windows companion app - 5 areas">
    <p className="maturity-readiness-summary">5 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessions de chat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Outils de bureau et autorisations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connexion Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installation et mises à jour</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">État et réparation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix install path - 5 areas">
    <p className="maturity-readiness-summary">5 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Activation et UX de l’application</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et état</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transfert d’installation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cycle de vie du Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime du service et protections</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0 %) / 0 sur 8 (0 %)</span>
        <span>8 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI and Codex provider path - 5 areas">
    <p className="maturity-readiness-summary">2 à examiner / 3 partiellement examinés</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrée image et multimodale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modèle et authentification</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 6 (16,7 %) / 4 sur 9 (44,4 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Harnais Codex natif</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 4 sur 9 (44,4 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Réponses et compatibilité des outils</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 4 (25 %) / 2 sur 5 (40 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voix et audio en temps réel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6 areas">
    <p className="maturity-readiness-summary">5 à examiner / 1 partiellement examiné</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversations d’agent</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API client</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Événements et approbations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Assistants de ressources</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 1 sur 6 (16,7 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Chemin du fournisseur OpenRouter - 4 domaines">
    <p className="maturity-readiness-summary">4 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime de chat et normalisation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 15 (0%) / 0 sur 15 (0%)</span>
        <span>15 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Génération de médias et parole</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0%) / 0 sur 7 (0%)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Récupération et diagnostics du fournisseur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et authentification du fournisseur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 14 (0%) / 0 sur 14 (0%)</span>
        <span>14 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9 domaines">
    <p className="maturity-readiness-summary">6 à examiner / 3 partiellement examinés</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Création et packaging des Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0%) / 0 sur 8 (0%)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins groupés</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0%) / 0 sur 6 (0%)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de canaux</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installation et exécution des Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0%) / 7 sur 20 (35%)</span>
        <span>13 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Approbations de Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0%) / 0 sur 6 (0%)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins de fournisseurs et d’outils</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 6 (16.7%) / 9 sur 21 (42.9%)</span>
        <span>12 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publication de Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0%) / 0 sur 6 (0%)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Test des Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0%) / 3 sur 11 (27.3%)</span>
        <span>8 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi et petits appareils Linux - 4 domaines">
    <p className="maturity-readiness-summary">4 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime du Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0%) / 0 sur 10 (0%)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Performances et diagnostics</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès distant et authentification</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0%) / 0 sur 9 (0%)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et compatibilité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 12 (0%) / 0 sur 12 (0%)</span>
        <span>12 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sécurité, authentification, appairage et secrets - 6 domaines">
    <p className="maturity-readiness-summary">2 partiellement examinés / 4 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Politique d’approbation et protections des outils</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0%) / 3 sur 6 (50%)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôle d’accès aux canaux</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0%) / 0 sur 3 (0%)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hygiène des identifiants et des secrets</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement examiné - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 5 sur 11 (45.5%)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Appairage des appareils et des Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0%) / 0 sur 11 (0%)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Authentification du Gateway et accès distant</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0%) / 0 sur 9 (0%)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Confiance des Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0%) / 0 sur 2 (0%)</span>
        <span>2 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Session, mémoire et moteur de contexte - 9 domaines">
    <p className="maturity-readiness-summary">2 nécessitent une revue / 7 partiellement revus</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestion des sessions CLI et des transcriptions</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Moteur de contexte</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 4 sur 7 (57,1 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prompts principaux et contexte</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 3 sur 8 (37,5 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Historique entre clients et parité des sessions</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 2 sur 5 (40 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostics, maintenance et récupération</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 4 sur 10 (40 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mémoire</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 6 sur 13 (46,2 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage des sessions</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 1 sur 4 (25 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestion des tokens</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 2 sur 10 (20 %)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persistance des transcriptions</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles et approbations natifs</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles et approbations natifs</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0 %) / 0 sur 8 (0 %)</span>
        <span>8 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 domaines">
    <p className="maturity-readiness-summary">5 nécessitent une revue</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0 %) / 0 sur 1 (0 %)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles et approbations natifs</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Nécessite une revue - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0 %) / 0 sur 9 (0 %)</span>
        <span>9 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Observabilité - 5 domaines">
    <p className="maturity-readiness-summary">3 partiellement revus / 2 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Collecte de diagnostics</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 8 (12.5%) / 3 sur 10 (30%)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Santé et réparation</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 12 (8.3%) / 5 sur 18 (27.8%)</span>
        <span>13 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Journalisation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostics de session</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exportation de télémétrie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement revu - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 13 (7.7%) / 7 sur 21 (33.3%)</span>
        <span>14 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 domaines">
    <p className="maturity-readiness-summary">5 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entrée et commandes</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0%) / 0 sur 8 (0%)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exécution du shell local</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rendu et sécurité de la sortie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modes d’exécution</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 14 (0%) / 0 sur 14 (0%)</span>
        <span>14 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestion de session</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0%) / 0 sur 3 (0%)</span>
        <span>3 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Voix et conversation en temps réel - 6 domaines">
    <p className="maturity-readiness-summary">6 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversation dans l’application native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessions de conversation en temps réel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0%) / 0 sur 11 (0%)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Parole et transcription</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilité de la conversation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0%) / 0 sur 5 (0%)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fournisseurs de conversation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0%) / 0 sur 7 (0%)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Activation vocale et routage</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0%) / 0 sur 4 (0%)</span>
        <span>4 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Canal d’appels vocaux - 5 domaines">
    <p className="maturity-readiness-summary">5 à examiner</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0%) / 0 sur 1 (0%)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0%) / 0 sur 2 (0%)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 1 (0%) / 0 sur 1 (0%)</span>
        <span>1 lacune de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0%) / 0 sur 2 (0%)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voix et appels en temps réel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À examiner - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0%) / 0 sur 2 (0%)</span>
        <span>2 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Surfaces compagnes watchOS - 5 domaines">
    <p className="maturity-readiness-summary">5 à réviser</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Livraison et récupération</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribution et support</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Approbations d’exécution</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notifications et réponses</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interface utilisateur de l’application Watch</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 3 (0 %) / 0 sur 3 (0 %)</span>
        <span>3 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Outils de recherche Web - 4 domaines">
    <p className="maturity-readiness-summary">2 à réviser / 2 partiellement révisés</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sécurité réseau</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fournisseurs de recherche</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>2 sur 19 (10,5 %) / 2 sur 19 (10,5 %)</span>
        <span>17 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et diagnostics</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 9 (0 %) / 0 sur 9 (0 %)</span>
        <span>9 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Disponibilité des outils et récupération</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>2 sur 11 (18,2 %) / 3 sur 12 (25 %)</span>
        <span>9 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 domaines">
    <p className="maturity-readiness-summary">5 à réviser</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et identité</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 7 (0 %) / 0 sur 7 (0 %)</span>
        <span>7 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration et opérations du canal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 5 (0 %) / 0 sur 5 (0 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routage et livraison des conversations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 4 (0 %) / 0 sur 4 (0 %)</span>
        <span>4 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Médias et contenu enrichi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contrôles natifs et approbations</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 2 (0 %) / 0 sur 2 (0 %)</span>
        <span>2 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows via WSL2 - 6 domaines">
    <p className="maturity-readiness-summary">5 à réviser / 1 partiellement révisé</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Domaine</span><span>Fonctionnalités / ID de couverture</span><span>Suivi</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Navigateur et interface utilisateur de contrôle</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 8 (0 %) / 0 sur 8 (0 %)</span>
        <span>8 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostics et réparation</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Partiellement révisé - Validation complète de la taxonomie</span>
        </div>
        <span>1 sur 6 (16,7 %) / 3 sur 8 (37,5 %)</span>
        <span>5 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accès et exposition du Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 11 (0 %) / 0 sur 11 (0 %)</span>
        <span>11 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cycle de vie du service Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 10 (0 %) / 0 sur 10 (0 %)</span>
        <span>10 lacunes de capacité</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuration de WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">À réviser - Validation complète de la taxonomie</span>
        </div>
        <span>0 sur 6 (0 %) / 0 sur 6 (0 %)</span>
        <span>6 lacunes de capacité</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Dernière mise à jour : 2026-06-22
