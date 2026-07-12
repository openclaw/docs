---
summary: Oceny gotowości wydania OpenClaw dla obszarów produktu, integracji i obsługiwanych przepływów pracy.
title: Karta oceny dojrzałości
x-i18n:
    generated_at: "2026-07-12T15:17:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Karta oceny dojrzałości

<div className="maturity-hero">
  <p className="maturity-kicker">gotowość do wydania — wygenerowano na podstawie taksonomii i dowodów QA</p>
  <p className="maturity-hero-title">Praktyczny obraz tego, co jest gotowe, co zostało potwierdzone, a co nadal wymaga pracy.</p>
  <p>50 obszarów — 281 zakresów możliwości — deterministyczne pokrycie oraz ocenione przez ludzi jakość i kompletność.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Przeglądaj obszary</a> / <a href="#qa-evidence-summary">Sprawdź dowody QA</a> / <a href="/pl/maturity/taxonomy">Przeczytaj taksonomię</a></p>
</div>

## Do czego służy ta strona

Ta strona pomaga odpowiedzieć na jedno pytanie: które obszary OpenClaw są wiarygodnymi kandydatami do wydania i jakie dowody potwierdzają tę ocenę? Pokrycie wynika z deterministycznych dowodów QA, natomiast jakość i kompletność są utrzymywane w formie zweryfikowanych ocen dojrzałości.

## W skrócie

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Ocena dojrzałości</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alfa</span>
      <span>Jakość + kompletność</span>
      <span>Pokrycie: eksperymentalne — 4%</span>
      <span>Jakość: alfa — 64%</span>
      <span>Kompletność: beta — 71%</span>
    </div>
  </div>
</div>

Pokrycie jest celowo oparte na dowodach: dany zakres nie staje się „gotowy” wyłącznie dlatego, że istnieje jego implementacja. Nie jest ono uwzględniane w ocenie dojrzałości, ale OpenClaw dąży do utrzymania z czasem kompleksowego pokrycia powyżej 90% dla dojrzałych funkcji na poziomie stabilnym lub wyższym.

## Przedziały ocen

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alfa</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stabilny</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Przeglądarka obszarów

<a id="surface-explorer" />

Obszary są uporządkowane według poziomu dojrzałości, kompletności i jakości. Przy każdym wierszu podano również obsługę LTS, co ułatwia porównanie opcji gotowych do wydania.

  <Tabs>
  <Tab title="All surfaces">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Obszar</span><span>Pokrycie</span><span>Jakość</span><span>Kompletność</span><span>Wsparcie</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>7 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Środowisko wykonawcze Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>13 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Host Gateway w systemie Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Host Gateway w systemie macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>7 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#android-app"><span className="maturity-surface-title">Aplikacja na Androida</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>7 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Aplikacja na iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>8 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Środowisko uruchomieniowe agenta</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Mechanizm sesji, pamięci i kontekstu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Struktura kanałów</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Automatyzacja przeglądarki oraz narzędzia wykonywania poleceń i piaskownicy</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#observability"><span className="maturity-surface-title">Obserwowalność</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy OpenAI i Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplikacja internetowa Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Narzędzia wyszukiwania internetowego</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#plugins"><span className="maturity-surface-title">Pluginy</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Bezpieczeństwo, uwierzytelnianie, parowanie i sekrety</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatyzacja: Cron, haki, zadania, odpytywanie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hosting z użyciem Docker i Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows przez WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi i małe urządzenia z systemem Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Pełne — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Pełne — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage i BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Aplikacja towarzysząca dla macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Rozumienie i generowanie multimediów</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Narzędzia do generowania obrazów, filmów i muzyki</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Lokalni dostawcy modeli: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Niszowi dostawcy hostowani</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Rozmowy głosowe w czasie rzeczywistym</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Natywny system Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hosting w Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, kanały regionalne</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK aplikacji OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Ścieżka instalacji Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperymentalny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Kanał połączeń głosowych</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperymentalny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Interfejsy aplikacji towarzyszącej na watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperymentalny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Aplikacja towarzysząca na Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planowany</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Natywna aplikacja towarzysząca na Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planowany</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Rdzeń">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Obszar</span><span>Pokrycie</span><span>Jakość</span><span>Kompletność</span><span>Wsparcie</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>7 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Środowisko wykonawcze Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>13 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Środowisko wykonawcze agenta</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Mechanizm sesji, pamięci i kontekstu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Struktura kanałów</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#observability"><span className="maturity-surface-title">Obserwowalność</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplikacja internetowa Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#plugins"><span className="maturity-surface-title">Pluginy</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Bezpieczeństwo, uwierzytelnianie, parowanie i sekrety</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatyzacja: Cron, punkty zaczepienia, zadania, odpytywanie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Rozumienie i generowanie multimediów</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Głos i rozmowa w czasie rzeczywistym</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK aplikacji OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Platforma">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Obszar</span><span>Pokrycie</span><span>Jakość</span><span>Kompletność</span><span>Wsparcie</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Host Gateway w systemie Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Host Gateway w systemie macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>7 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#android-app"><span className="maturity-surface-title">Aplikacja na Androida</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>7 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Aplikacja na iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>8 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hosting w Dockerze i Podmanie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows przez WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi i małe urządzenia z systemem Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Aplikacja towarzysząca dla macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Natywny Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hosting w Kubernetesie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Ścieżka instalacji Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperymentalny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Interfejsy aplikacji towarzyszącej na watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperymentalny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Aplikacja towarzysząca na system Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planowany</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Natywna aplikacja towarzysząca na system Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planowany</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kanał">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Obszar</span><span>Pokrycie</span><span>Jakość</span><span>Kompletność</span><span>Wsparcie</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabilny</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabilny</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Pełne — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Pełne — 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage i BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, kanały regionalne</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Kanał połączeń głosowych</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperymentalny</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Dostawca i narzędzie">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Obszar</span><span>Pokrycie</span><span>Jakość</span><span>Kompletność</span><span>Wsparcie</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Automatyzacja przeglądarki oraz narzędzia exec i piaskownicy</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy OpenAI i Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Częściowe — 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Narzędzia wyszukiwania w internecie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Ścieżka dostawcy OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Narzędzia do generowania obrazów, filmów i muzyki</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Lokalni dostawcy modeli: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 obszarów</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalne</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/pl/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Mniej popularni dostawcy hostowani</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 obszary</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Pokrycie</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperymentalny</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Jakość</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kompletność</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Brak</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Podsumowanie dowodów QA

Poniższe kontrole pokazują, które obszary karty wyników zostały sprawdzone na podstawie dowodów z profilu QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Pełna walidacja taksonomii</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 kontroli — 94 zakończone powodzeniem, 2 zablokowane</span>
    <span>0 z 281 (0%) obszarów — 20 z 1675 (1.2%) funkcji — 77 z 1665 (4.6%) identyfikatorów pokrycia</span>
  </div>
</div>

### Gotowość według obszaru

Otwórz powierzchnię, aby sprawdzić stan dowodów dla każdej kategorii. Lista pozostaje zwinięta, dzięki czemu strona jest czytelna na pierwszy rzut oka.

<AccordionGroup>
  <Accordion title="Środowisko wykonawcze agenta — 9 obszarów">
    <p className="maturity-readiness-summary">8 częściowo sprawdzonych / 1 wymaga sprawdzenia</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wykonywanie tury agenta</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 7 z 24 (29.2%)</span>
        <span>17 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zewnętrzne środowiska wykonawcze i podagenci</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 3 z 10 (30%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wykonywanie u hostowanego dostawcy</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 5 (20%) / 1 z 5 (20%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostawcy lokalni i samodzielnie hostowani</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wybór modelu i środowiska wykonawczego</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 2 z 8 (25%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uwierzytelnianie dostawcy</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 4 z 17 (23.5%)</span>
        <span>13 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Przesyłanie strumieniowe i postęp</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 5 z 9 (55.6%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wywołania narzędzi i obsługa odpowiedzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 15 z 23 (65.2%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mechanizmy kontroli wykonywania narzędzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzono — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 6 z 12 (50%)</span>
        <span>6 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikacja na Androida — 7 obszarów">
    <p className="maturity-readiness-summary">7 wymaga sprawdzenia</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja połączenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Środowisko wykonawcze urządzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dystrybucja</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rejestrowanie multimediów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Czat mobilny</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ustawienia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Głos</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ścieżka dostawcy Anthropic — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga sprawdzenia</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dane wejściowe multimediów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wybór modelu i środowiska wykonawczego</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pamięć podręczna promptów i kontekst</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uwierzytelnianie dostawcy i odzyskiwanie sprawności</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transport żądań i semantyka tury</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatyzacja: Cron, hooki, zadania, odpytywanie — 6 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu / 1 częściowo przejrzany</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hooki automatyzacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zadania i przepływy w tle</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zadania Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 15 (0%) / 0 z 15 (0%)</span>
        <span>15 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Przyjmowanie zdarzeń</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 15 (0%) / 0 z 15 (0%)</span>
        <span>15 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 1 z 7 (14.3%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sterowanie odpytywaniem</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatyzacja przeglądarki oraz narzędzia wykonywania i piaskownicy — 3 obszary">
    <p className="maturity-readiness-summary">2 częściowo przejrzane / 1 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automatyzacja przeglądarki</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 8 (12.5%) / 1 z 8 (12.5%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zasady piaskownicy i narzędzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wywoływanie i wykonywanie narzędzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>2 z 6 (33.3%) / 4 z 8 (50%)</span>
        <span>4 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikacja internetowa Gateway — 6 obszarów">
    <p className="maturity-readiness-summary">3 wymagają przeglądu / 3 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp przez przeglądarkę i zaufanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rozmowy w przeglądarce w czasie rzeczywistym</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfejs użytkownika przeglądarki</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 1 z 12 (8.3%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konsola operatora</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 1 z 12 (8.3%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konwersacje WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 15 (0%) / 2 z 20 (10%)</span>
        <span>18 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Struktura kanałów — 8 obszarów">
    <p className="maturity-readiness-summary">4 wymagają przeglądu / 4 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Polecenia działań kanału i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 1 z 7 (14.3%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 5 z 27 (18.5%)</span>
        <span>22 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zachowanie w wątkach grupowych i pokojach otoczenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 4 z 11 (36.4%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bramy dostępu przychodzącego i tożsamości</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Załączniki multimedialne i rozbudowane dane kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Potok dostarczania wychodzącego i odpowiedzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzany — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 8 z 21 (38.1%)</span>
        <span>13 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Stan kondycji i mechanizmy sterowania operatora</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub — 4 obszary">
    <p className="maturity-readiness-summary">4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Odkrywanie katalogu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zgodność i zaufanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cykl życia i kondycja Pluginów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 26 (0%) / 0 z 26 (0%)</span>
        <span>26 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publikowanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI — 7 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu / 2 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obserwowalność CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 6 (16,7%) / 1 z 6 (16,7%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostyka</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zarządzanie usługą Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 1 z 7 (14,3%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wprowadzenie i konfiguracja uwierzytelniania</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja Pluginów i kanałów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktualizacje i uaktualnienia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord — 6 obszarów">
    <p className="maturity-readiness-summary">6 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rozmowy głosowe i połączenia w czasie rzeczywistym</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hosting za pomocą Docker i Podman — 4 obszary">
    <p className="maturity-readiness-summary">3 wymagają przeglądu / 1 częściowo przejrzany</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Piaskownica agenta i narzędzia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obsługa kontenerów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja kontenerów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wydawanie i walidacja obrazów</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 5 (20%) / 2 z 7 (28,6%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, kanały regionalne — 4 obszary">
    <p className="maturity-readiness-summary">4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Środowisko wykonawcze Gateway — 13 obszarów">
    <p className="maturity-readiness-summary">9 wymaga przeglądu / 4 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zatwierdzenia i zdalne wykonywanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uwierzytelnianie i parowanie urządzeń</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cykl życia Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 4 z 12 (33.3%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfejsy API RPC i zdarzenia Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 20 (0%) / 2 z 22 (9.1%)</span>
        <span>20 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kondycja, diagnostyka i naprawa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hostowany interfejs internetowy</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfejsy API HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 4 (25%) / 1 z 4 (25%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp sieciowy i wykrywanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Węzły i możliwości zdalne</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zgodność protokołu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Role i uprawnienia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mechanizmy kontroli bezpieczeństwa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Połączenie WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 8 (12.5%) / 1 z 8 (12.5%)</span>
        <span>7 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 16 (0%) / 0 z 16 (0%)</span>
        <span>16 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne mechanizmy sterowania i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 16 (0%) / 0 z 16 (0%)</span>
        <span>16 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ścieżka dostawcy Google — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bezpośrednie środowisko uruchomieniowe Gemini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia, wyszukiwanie i komunikacja w czasie rzeczywistym</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie modeli i punkty końcowe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Buforowanie promptów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja dostawcy i dane uwierzytelniające</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Narzędzia do generowania obrazów, filmów i muzyki — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generowanie obrazów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i wykrywanie multimediów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generowanie muzyki</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cykl życia i dostarczanie zadań</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generowanie filmów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage i BlueBubbles — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikacja na iOS — 8 obszarów">
    <p className="maturity-readiness-summary">8 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obszar roboczy i ekran</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Czat i sesje</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Polecenia urządzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dystrybucja</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i diagnostyka Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i udostępnianie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Powiadomienia i działanie w tle</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obsługa głosowa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hosting Kubernetes — 4 obszary">
    <p className="maturity-readiness-summary">4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i udostępnianie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cykl życia klastra</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i sekrety</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja wdrożenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikacja towarzysząca dla systemu Linux — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dystrybucja aplikacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Czat i sesje</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Możliwości środowiska graficznego</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Łączność z Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Stan i diagnostyka</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Host Gateway w systemie Linux — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Środowiska docelowe wdrożenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostyka i naprawa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Środowisko uruchomieniowe Gateway i sterowanie usługą</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i aktualizacje hosta</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp zdalny i bezpieczeństwo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Lokalni dostawcy modeli: Ollama, vLLM, SGLang, LM Studio — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pamięć lokalna i osadzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne Pluginy dostawców</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bezpieczeństwo sieci i mechanizmy kontroli promptów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zgodność ze środowiskami uruchomieniowymi kompatybilnymi z OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja, cykl życia i diagnostyka dostawców</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Niszowi dostawcy usług hostingowych — 3 obszary">
    <p className="maturity-readiness-summary">3 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hostowani dostawcy modeli LLM</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hostowani dostawcy usług multimedialnych</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operacje dostawców</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikacja towarzysząca na macOS — 8 obszarów">
    <p className="maturity-readiness-summary">8 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obszar roboczy</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja lokalna</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Funkcje natywne</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Połączenia zdalne</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zdalny WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Stan i ustawienia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Głos i rozmowa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Host Gateway na macOS — 7 obszarów">
    <p className="maturity-readiness-summary">7 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostyka i obserwowalność</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cykl życia usługi Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integracja z lokalnym Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uprawnienia i funkcje natywne</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Profile i izolacja</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tryb zdalnego Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix — 6 obszarów">
    <p className="maturity-readiness-summary">6 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kierowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Szyfrowanie i weryfikacja</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat — 4 obszary">
    <p className="maturity-readiness-summary">4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kierowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Rozpoznawanie i generowanie multimediów — 6 obszarów">
    <p className="maturity-readiness-summary">4 wymagają przeglądu / 2 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obsługa multimediów w kanałach</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja multimediów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generowanie multimediów</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 17 (5,9%) / 1 z 19 (5,3%)</span>
        <span>18 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Przyjmowanie multimediów i dostęp do nich</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rozpoznawanie multimediów</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 1 z 14 (7,1%)</span>
        <span>13 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostarczanie zamiany tekstu na mowę</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kierowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Natywny system Windows — 4 obszary">
    <p className="maturity-readiness-summary">4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zarządzanie Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obsługa sieci</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktualizacje</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Natywna aplikacja towarzysząca dla Windows — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sesje czatu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Narzędzia pulpitu i uprawnienia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Połączenie z Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instalacja i aktualizacje</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Stan i naprawa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ścieżka instalacji Nix — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktywacja i środowisko użytkownika aplikacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i stan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Przekazanie po instalacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cykl życia Pluginu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Środowisko uruchomieniowe usługi i zabezpieczenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ścieżka dostawcy OpenAI i Codex — 5 obszarów">
    <p className="maturity-readiness-summary">2 wymagają przeglądu / 3 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obrazy i dane wejściowe multimodalne</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model i uwierzytelnianie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 6 (16.7%) / 4 z 9 (44.4%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne środowisko testowe Codex</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 4 z 9 (44.4%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Odpowiedzi i zgodność narzędzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 4 (25%) / 2 z 5 (40%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Głos i dźwięk w czasie rzeczywistym</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="SDK aplikacji OpenClaw — 6 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu / 1 częściowo przejrzany</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konwersacje agentów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API klienta</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zgodność</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zdarzenia i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp do Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Funkcje pomocnicze zasobów</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 1 z 6 (16.7%)</span>
        <span>5 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ścieżka dostawcy OpenRouter — 4 obszary">
    <p className="maturity-readiness-summary">4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Środowisko wykonawcze czatu i normalizacja</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 15 (0%) / 0 z 15 (0%)</span>
        <span>15 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generowanie multimediów i mowa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Odzyskiwanie działania dostawcy i diagnostyka</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i uwierzytelnianie dostawcy</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 14 (0%) / 0 z 14 (0%)</span>
        <span>14 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Pluginy — 9 obszarów">
    <p className="maturity-readiness-summary">6 wymaga przeglądu / 3 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tworzenie i pakowanie pluginów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dołączone pluginy</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginy kanałów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instalowanie i uruchamianie pluginów</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 7 z 20 (35%)</span>
        <span>13 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zatwierdzanie pluginów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginy dostawców i narzędzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 6 (16.7%) / 9 z 21 (42.9%)</span>
        <span>12 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publikowanie pluginów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Testowanie pluginów</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 3 z 11 (27.3%)</span>
        <span>8 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi i małe urządzenia z systemem Linux — 4 obszary">
    <p className="maturity-readiness-summary">4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Środowisko wykonawcze Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Wydajność i diagnostyka</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp zdalny i uwierzytelnianie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i zgodność</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 12 (0%) / 0 z 12 (0%)</span>
        <span>12 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Bezpieczeństwo, uwierzytelnianie, parowanie i sekrety — 6 obszarów">
    <p className="maturity-readiness-summary">2 częściowo przejrzane / 4 wymagają przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zasady zatwierdzania i zabezpieczenia narzędzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 3 z 6 (50%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrola dostępu do kanałów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bezpieczne zarządzanie poświadczeniami i sekretami</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 5 z 11 (45.5%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Parowanie urządzeń i węzłów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uwierzytelnianie Gateway i dostęp zdalny</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zaufanie do pluginów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sesja, pamięć i silnik kontekstu — 9 obszarów">
    <p className="maturity-readiness-summary">2 wymagają przeglądu / 7 częściowo przejrzanych</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zarządzanie sesjami i transkrypcjami w CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 braki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Silnik kontekstu</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzano — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 4 z 7 (57.1%)</span>
        <span>3 braki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Główne prompty i kontekst</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzano — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 3 z 8 (37.5%)</span>
        <span>5 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Historia między klientami i równoważność sesji</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzano — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 2 z 5 (40%)</span>
        <span>3 braki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostyka, konserwacja i odzyskiwanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzano — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 4 z 10 (40%)</span>
        <span>6 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pamięć</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzano — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 6 z 13 (46.2%)</span>
        <span>7 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie sesji</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzano — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 1 z 4 (25%)</span>
        <span>3 braki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zarządzanie tokenami</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzano — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 2 z 10 (20%)</span>
        <span>8 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trwałe przechowywanie transkrypcji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 braki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 brak w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 braki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 brak w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 brak w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 braków w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 braków w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 brak w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 brak w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 braków w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Obserwowalność — 5 obszarów">
    <p className="maturity-readiness-summary">3 częściowo sprawdzone / 2 wymagają sprawdzenia</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gromadzenie danych diagnostycznych</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzone — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 8 (12,5%) / 3 z 10 (30%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kondycja i naprawa</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzone — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 12 (8,3%) / 5 z 18 (27,8%)</span>
        <span>13 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rejestrowanie zdarzeń</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostyka sesji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eksport telemetrii</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo sprawdzone — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 13 (7,7%) / 7 z 21 (33,3%)</span>
        <span>14 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga sprawdzenia</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dane wejściowe i polecenia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokalne wykonywanie poleceń powłoki</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bezpieczeństwo renderowania i danych wyjściowych</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tryby środowiska uruchomieniowego</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 14 (0%) / 0 z 14 (0%)</span>
        <span>14 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zarządzanie sesjami</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Rozmowy głosowe i w czasie rzeczywistym — 6 obszarów">
    <p className="maturity-readiness-summary">6 wymaga sprawdzenia</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rozmowy w aplikacji natywnej</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sesje rozmów w czasie rzeczywistym</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mowa i transkrypcja</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obserwowalność rozmów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostawcy rozmów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktywacja głosowa i kierowanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kanał połączeń głosowych — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga sprawdzenia</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kierowanie i dostarczanie rozmów</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 1 (0%) / 0 z 1 (0%)</span>
        <span>1 luka w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i rozbudowane treści</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Głos i połączenia w czasie rzeczywistym</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga sprawdzenia — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Powierzchnie aplikacji towarzyszącej watchOS — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostarczanie i odzyskiwanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dystrybucja i wsparcie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zatwierdzanie wykonywania poleceń</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Powiadomienia i odpowiedzi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfejs aplikacji na zegarek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 3 (0%) / 0 z 3 (0%)</span>
        <span>3 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Narzędzia wyszukiwania w internecie — 4 obszary">
    <p className="maturity-readiness-summary">2 wymagają przeglądu / 2 częściowo przejrzane</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bezpieczeństwo sieci</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostawcy wyszukiwania</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>2 z 19 (10.5%) / 2 z 19 (10.5%)</span>
        <span>17 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i diagnostyka</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 9 (0%) / 0 z 9 (0%)</span>
        <span>9 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostępność narzędzi i pobieranie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>2 z 11 (18.2%) / 3 z 12 (25%)</span>
        <span>9 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp — 5 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i tożsamość</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 7 (0%) / 0 z 7 (0%)</span>
        <span>7 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja i obsługa kanału</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 5 (0%) / 0 z 5 (0%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kierowanie i dostarczanie konwersacji</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 4 (0%) / 0 z 4 (0%)</span>
        <span>4 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Multimedia i treści rozszerzone</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Natywne elementy sterujące i zatwierdzanie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 2 (0%) / 0 z 2 (0%)</span>
        <span>2 luki w możliwościach</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows za pośrednictwem WSL2 — 6 obszarów">
    <p className="maturity-readiness-summary">5 wymaga przeglądu / 1 częściowo przejrzany</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Obszar</span><span>Funkcje / identyfikatory pokrycia</span><span>Dalsze działania</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Przeglądarka i interfejs sterowania</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 8 (0%) / 0 z 8 (0%)</span>
        <span>8 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostyka i naprawa</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Częściowo przejrzane — pełna walidacja taksonomii</span>
        </div>
        <span>1 z 6 (16.7%) / 3 z 8 (37.5%)</span>
        <span>5 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dostęp i ekspozycja Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 11 (0%) / 0 z 11 (0%)</span>
        <span>11 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cykl życia usługi Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 10 (0%) / 0 z 10 (0%)</span>
        <span>10 luk w możliwościach</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguracja WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Wymaga przeglądu — pełna walidacja taksonomii</span>
        </div>
        <span>0 z 6 (0%) / 0 z 6 (0%)</span>
        <span>6 luk w możliwościach</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Ostatnia aktualizacja: 2026-06-22
