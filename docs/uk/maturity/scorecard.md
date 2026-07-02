---
summary: Оцінки готовності релізу OpenClaw для продуктових напрямів, інтеграцій і підтримуваних робочих процесів.
title: Картка оцінювання зрілості
x-i18n:
    generated_at: "2026-07-02T08:46:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Оцінна картка зрілості

<div className="maturity-hero">
  <p className="maturity-kicker">готовність до випуску - згенеровано з таксономії + доказів QA</p>
  <p className="maturity-hero-title">Практичний погляд на те, що готове, що доведено, і що ще потребує роботи.</p>
  <p>50 поверхонь - 281 область можливостей - детерміноване покриття плюс перевірені людьми якість і повнота.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Переглянути поверхні</a> / <a href="#qa-evidence-summary">Перевірити докази QA</a> / <a href="/uk/maturity/taxonomy">Прочитати таксономію</a></p>
</div>

## Для чого ця сторінка

Використовуйте цю сторінку, щоб відповісти на одне запитання: які поверхні OpenClaw є надійним вибором для випуску, і які докази підтримують це судження? Покриття походить із детермінованих доказів QA; якість і повнота підтримуються як перевірені оцінки зрілості.

## Короткий огляд

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Оцінка зрілості</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>Якість + повнота</span>
      <span>Покриття Experimental - 4%</span>
      <span>Якість Alpha - 64%</span>
      <span>Повнота Beta - 71%</span>
    </div>
  </div>
</div>

Покриття навмисно спирається на докази: область не стає «готовою» лише тому, що реалізація існує. Воно не є вхідним параметром для оцінки зрілості, але OpenClaw прагне з часом утримувати наскрізне покриття вище 90% для зрілих функцій рівня Stable або вище.

## Діапазони оцінок

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Experimental</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stable</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Провідник поверхонь

<a id="surface-explorer" />

Поверхні впорядковано за рівнем зрілості, повнотою та якістю. Підтримка LTS показана поруч із кожним рядком, щоб варіанти, готові до випуску, було легко порівнювати.

  <Tabs>
  <Tab title="Усі поверхні">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхня</span><span>Покриття</span><span>Якість</span><span>Повнота</span><span>Підтримка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Середовище виконання Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>13 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Хост Linux Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Хост macOS Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#android-app"><span className="maturity-surface-title">Застосунок Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Застосунок iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Середовище виконання агента</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Рушій сеансів, пам’яті та контексту</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Фреймворк каналів</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Інструменти автоматизації браузера, exec і пісочниці</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>3 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#observability"><span className="maturity-surface-title">Спостережуваність</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Шлях провайдера OpenAI і Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Вебзастосунок Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Інструменти вебпошуку</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#plugins"><span className="maturity-surface-title">Плагіни</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Безпека, автентифікація, сполучення та секрети</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Автоматизація: cron, хуки, завдання, опитування</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Хостинг Docker і Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows через WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 сфер</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi та малі пристрої Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 сфери</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Шлях провайдера Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 сфер</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 сфер</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Повна - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 сфер</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Повна - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Шлях провайдера Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 сфер</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage і BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">супутній застосунок macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">шлях постачальника OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Розуміння медіа та генерація медіа</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Інструменти генерації зображень, відео та музики</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Локальні постачальники моделей: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Довгохвості розміщені провайдери</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>3 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Голос і розмова в реальному часі</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Нативний Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Хостинг Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, регіональні канали</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK застосунків OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Шлях установлення Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Експериментальний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Канал голосових викликів</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Експериментальний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Супутні поверхні watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Експериментальний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Супутній застосунок Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Заплановано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Нативний супутній застосунок Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Заплановано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Core">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхня</span><span>Покриття</span><span>Якість</span><span>Повнота</span><span>Підтримка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Середовище виконання Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>13 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Середовище виконання агента</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Рушій сеансу, пам'яті та контексту</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Фреймворк каналів</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#observability"><span className="maturity-surface-title">Спостережуваність</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Вебзастосунок Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Безпека, автентифікація, сполучення та секрети</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Автоматизація: Cron, хуки, завдання, опитування</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Розуміння медіа та генерація медіа</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Голос і розмова в реальному часі</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Платформа">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхня</span><span>Покриття</span><span>Якість</span><span>Повнота</span><span>Підтримка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">хост Linux Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Часткова - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">хост macOS Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#android-app"><span className="maturity-surface-title">застосунок Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#ios-app"><span className="maturity-surface-title">застосунок iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Хостинг Docker і Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 сфери</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows через WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 сфер</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi і малі пристрої Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 сфери</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Супровідний застосунок macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 сфер</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Нативна Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 сфери</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Хостинг Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 сфери</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Шлях встановлення Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Експериментальний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Супутні поверхні watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Експериментальний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Супутній застосунок Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Заплановано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Нативний супутній застосунок Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Заплановано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Канал">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхня</span><span>Покриття</span><span>Якість</span><span>Завершеність</span><span>Підтримка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабільний</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабільний</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Повна - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Повна - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage і BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, регіональні канали</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Канал голосових викликів</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Експериментальний</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Провайдер та інструмент">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхня</span><span>Покриття</span><span>Якість</span><span>Повнота</span><span>Підтримка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Автоматизація браузера, exec та інструменти пісочниці</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>3 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Шлях провайдера OpenAI та Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частково - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Інструменти вебпошуку</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Шлях провайдера Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Шлях провайдера Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Шлях провайдера OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Інструменти генерації зображень, відео та музики</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Локальні провайдери моделей: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Повнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/uk/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Нішеві хостингові провайдери</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>3 області</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покриття</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Експериментальний</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Якість</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершеність</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Немає</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Підсумок доказів QA

Наведені нижче перевірки показують, які області картки оцінювання були перевірені доказами профілю QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Повна валідація таксономії</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 перевірок - 94 пройдено, 2 заблоковано</span>
    <span>0 з 281 (0%) областей - 20 з 1675 (1.2%) функцій - 77 з 1665 (4.6%) ID покриття</span>
  </div>
</div>

### Готовність за областями

Відкрийте поверхню, щоб переглянути стан доказів для кожної категорії. Список залишається згорнутим, щоб сторінка була корисною для швидкого огляду.

<AccordionGroup>
  <Accordion title="Середовище виконання агента - 9 областей">
    <p className="maturity-readiness-summary">8 частково перевірено / 1 потребує перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ID покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Виконання ходу агента</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 7 з 24 (29.2%)</span>
        <span>17 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Зовнішні середовища виконання та субагенти</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 3 з 10 (30%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Виконання через розміщеного провайдера</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>1 з 5 (20%) / 1 з 5 (20%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Локальні та самостійно розміщені провайдери</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вибір моделі та середовища виконання</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 2 з 8 (25%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Автентифікація провайдера</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 4 з 17 (23.5%)</span>
        <span>13 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Потокове передавання та прогрес</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 5 з 9 (55.6%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Виклики інструментів і обробка відповідей</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 15 з 23 (65.2%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Елементи керування виконанням інструментів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 6 з 12 (50%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Застосунок Android - 7 областей">
    <p className="maturity-readiness-summary">7 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ID покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування підключення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Середовище виконання пристрою</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Поширення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Захоплення медіа</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Мобільний чат</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Шлях провайдера Anthropic - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ID покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіавходи</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вибір моделі та середовища виконання</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Кеш промптів і контекст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Автентифікація та відновлення провайдера</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Транспорт запитів і семантика ходів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Автоматизація: Cron, хуки, завдання, опитування - 6 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки / 1 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Хуки автоматизації</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 11 (0%) / 0 з 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Фонові завдання та потоки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Завдання Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 15 (0%) / 0 з 15 (0%)</span>
        <span>15 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вхід подій</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 15 (0%) / 0 з 15 (0%)</span>
        <span>15 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 1 з 7 (14.3%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Елементи керування опитуванням</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Автоматизація браузера, exec та інструменти пісочниці - 3 області">
    <p className="maturity-readiness-summary">2 частково перевірено / 1 потребує перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Автоматизація браузера</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>1 з 8 (12.5%) / 1 з 8 (12.5%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Політика пісочниці та інструментів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Виклик і виконання інструментів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>2 з 6 (33.3%) / 4 з 8 (50%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Вебзастосунок Gateway - 6 областей">
    <p className="maturity-readiness-summary">3 потребують перевірки / 3 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ браузера та довіра</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Браузерне спілкування в реальному часі</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Інтерфейс браузера</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 1 з 12 (8.3%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфігурація</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Консоль оператора</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 1 з 12 (8.3%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Розмови WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 15 (0%) / 2 з 20 (10%)</span>
        <span>18 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Фреймворк каналів - 8 областей">
    <p className="maturity-readiness-summary">4 потребують перевірки / 4 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Дії, команди та схвалення каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 1 з 7 (14.3%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставка розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 5 з 27 (18.5%)</span>
        <span>22 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Поведінка групових потоків і фонових кімнат</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 4 з 11 (36.4%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вхідний доступ і перевірки ідентичності</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіавкладення та розширені дані каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вихідна доставка та конвеєр відповідей</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 8 з 21 (38.1%)</span>
        <span>13 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Стан, справність і елементи керування оператора</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 області">
    <p className="maturity-readiness-summary">4 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Виявлення каталогу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сумісність і довіра</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 12 (0%) / 0 із 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Життєвий цикл і стан Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 26 (0%) / 0 із 26 (0%)</span>
        <span>26 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Публікація</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки / 2 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Спостережуваність CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна перевірка таксономії</span>
        </div>
        <span>1 із 6 (16.7%) / 1 із 6 (16.7%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Діагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 10 (0%) / 0 із 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Керування службою Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 1 із 7 (14.3%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Онбординг і налаштування автентифікації</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування Plugin і каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Оновлення й модернізації</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 областей">
    <p className="maturity-readiness-summary">6 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 6 (0%) / 0 із 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та операції каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 10 (0%) / 0 із 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставка розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 12 (0%) / 0 із 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 1 (0%) / 0 із 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вбудовані елементи керування та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос у реальному часі та виклики</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Хостинг Docker і Podman - 4 області">
    <p className="maturity-readiness-summary">3 потребують перевірки / 1 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Пісочниця агента та інструменти</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Операції з контейнерами</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 11 (0%) / 0 із 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування контейнера</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна перевірка таксономії</span>
        </div>
        <span>0 із 6 (0%) / 0 із 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Випуск і перевірка образів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна перевірка таксономії</span>
        </div>
        <span>1 із 5 (20%) / 2 із 7 (28.6%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, регіональні канали - 4 області">
    <p className="maturity-readiness-summary">4 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та експлуатація каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставка розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Середовище виконання Gateway - 13 областей">
    <p className="maturity-readiness-summary">9 потребують перевірки / 4 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Схвалення та віддалене виконання</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Автентифікація та сполучення пристроїв</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Життєвий цикл Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна перевірка таксономії</span>
        </div>
        <span>0 з 7 (0%) / 4 з 12 (33.3%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API RPC та події Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна перевірка таксономії</span>
        </div>
        <span>0 з 20 (0%) / 2 з 22 (9.1%)</span>
        <span>20 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Справність, діагностика та відновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Розміщена вебповерхня</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна перевірка таксономії</span>
        </div>
        <span>1 з 4 (25%) / 1 з 4 (25%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ до мережі та виявлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodes і віддалені можливості</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 8 (0%) / 0 з 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сумісність протоколу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ролі та дозволи</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Засоби контролю безпеки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Підключення WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - Повна перевірка таксономії</span>
        </div>
        <span>1 з 8 (12.5%) / 1 з 8 (12.5%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 11 (0%) / 0 з 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та експлуатація каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 16 (0%) / 0 з 16 (0%)</span>
        <span>16 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставка розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні елементи керування та схвалення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна перевірка таксономії</span>
        </div>
        <span>0 з 16 (0%) / 0 з 16 (0%)</span>
        <span>16 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Шлях провайдера Google - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Безпосереднє середовище виконання Gemini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа, пошук і реальний час</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація моделей і кінцеві точки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Кешування промптів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування провайдера та облікові дані</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Інструменти генерації зображень, відео та музики - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерація зображень</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та виявлення медіа</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерація музики</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Життєвий цикл і доставка завдань</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 12 (0%) / 0 з 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерація відео</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 11 (0%) / 0 з 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage і BlueBubbles - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування й операції каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 11 (0%) / 0 з 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація розмов і доставка</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні елементи керування та схвалення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Застосунок iOS - 8 областей">
    <p className="maturity-readiness-summary">8 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Полотно та екран</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Чат і сеанси</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Команди пристрою</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Розповсюдження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та діагностика Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та поширення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сповіщення та фоновий режим</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Хостинг Kubernetes - 4 області">
    <p className="maturity-readiness-summary">4 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ і відкриття</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Життєвий цикл кластера</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфігурація та секрети</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування розгортання</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Супровідний застосунок Linux - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Поширення застосунку</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Чат і сеанси</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Можливості робочого столу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Підключення до Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Стан і діагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Хост Linux Gateway - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Цілі розгортання</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Діагностика та відновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Середовище виконання Gateway і керування службою</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та оновлення хоста</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Віддалений доступ і безпека</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Локальні провайдери моделей: Ollama, vLLM, SGLang, LM Studio - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Локальна пам’ять і вбудовування</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні Plugin провайдерів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Мережева безпека та засоби керування промптами</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сумісність середовища виконання, сумісного з OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 8 (0%) / 0 з 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування, життєвий цикл і діагностика провайдера</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 12 (0%) / 0 з 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Нішеві хостингові провайдери - 3 області">
    <p className="maturity-readiness-summary">3 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Хостингові провайдери LLM</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 12 (0%) / 0 з 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Хостингові медіапровайдери</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 8 (0%) / 0 з 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Операції провайдерів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - Повна валідація таксономії</span>
        </div>
        <span>0 з 12 (0%) / 0 з 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="супровідний застосунок macOS - 8 областей">
    <p className="maturity-readiness-summary">8 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Полотно</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Локальне налаштування</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні можливості</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Віддалені підключення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Віддалений WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Стан і налаштування</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос і розмова</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="хост macOS Gateway - 7 областей">
    <p className="maturity-readiness-summary">7 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Діагностика та спостережуваність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Життєвий цикл служби Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 10 (0%) / 0 із 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Інтеграція з локальним Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 9 (0%) / 0 із 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Дозволи та нативні можливості</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Профілі та ізоляція</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Режим віддаленого Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 областей">
    <p className="maturity-readiness-summary">6 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування каналу та операції</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставка розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 1 (0%) / 0 із 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Шифрування та перевірка</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 1 (0%) / 0 із 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні елементи керування та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 із 6 (0%) / 0 із 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 сфери">
    <p className="maturity-readiness-summary">4 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Сфера</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування каналів і операції</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставлення розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Розуміння медіа та генерація медіа - 6 сфер">
    <p className="maturity-readiness-summary">4 потребують перегляду / 2 частково переглянуто</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Сфера</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Обробка медіа в каналі</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфігурація медіа</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерація медіа</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна перевірка таксономії</span>
        </div>
        <span>1 з 17 (5.9%) / 1 з 19 (5.3%)</span>
        <span>18 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Приймання медіа та доступ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 8 (0%) / 0 з 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Розуміння медіа</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна перевірка таксономії</span>
        </div>
        <span>0 з 12 (0%) / 1 з 14 (7.1%)</span>
        <span>13 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доставлення перетворення тексту на мовлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 сфер">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Сфера</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування каналів і операції</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставлення розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні елементи керування та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Native Windows - 4 сфери">
    <p className="maturity-readiness-summary">4 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Сфера</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Керування Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 11 (0%) / 0 з 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Мережеві можливості</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Оновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Нативний застосунок-компаньйон для Windows — 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сеанси чату</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 2 (0%) / 0 із 2 (0%)</span>
        <span>2 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Інструменти робочого столу та дозволи</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 10 (0%) / 0 із 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Підключення до Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Встановлення та оновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Стан і відновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Шлях встановлення Nix — 5 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Активація та UX застосунку</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфігурація та стан</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Передавання встановлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Життєвий цикл Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Середовище виконання служби та запобіжники</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 8 (0%) / 0 із 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Шлях постачальника OpenAI і Codex — 5 областей">
    <p className="maturity-readiness-summary">2 потребують перевірки / 3 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Зображення та мультимодальне введення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 2 (0%) / 0 із 2 (0%)</span>
        <span>2 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Модель і автентифікація</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено — повна валідація таксономії</span>
        </div>
        <span>1 із 6 (16.7%) / 4 із 9 (44.4%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативна обгортка Codex</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено — повна валідація таксономії</span>
        </div>
        <span>0 із 2 (0%) / 4 із 9 (44.4%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Відповіді та сумісність інструментів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено — повна валідація таксономії</span>
        </div>
        <span>1 із 4 (25%) / 2 із 5 (40%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос і аудіо в реальному часі</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 2 (0%) / 0 із 2 (0%)</span>
        <span>2 прогалини в можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK — 6 областей">
    <p className="maturity-readiness-summary">5 потребують перевірки / 1 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Розмови агентів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 6 (0%) / 0 із 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Клієнтський API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сумісність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Події та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ до Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки — повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Допоміжні засоби ресурсів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено — повна валідація таксономії</span>
        </div>
        <span>0 із 5 (0%) / 1 із 6 (16.7%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Шлях провайдера OpenRouter - 4 області">
    <p className="maturity-readiness-summary">4 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Середовище виконання чату та нормалізація</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 15 (0%) / 0 з 15 (0%)</span>
        <span>15 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерація медіа та мовлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Відновлення провайдера та діагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування провайдера та автентифікація</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 14 (0%) / 0 з 14 (0%)</span>
        <span>14 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Плагіни - 9 областей">
    <p className="maturity-readiness-summary">6 потребують перевірки / 3 частково перевірено</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Створення та пакування плагінів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 8 (0%) / 0 з 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вбудовані плагіни</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Плагін Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Канальні плагіни</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Встановлення та запуск плагінів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 7 з 20 (35%)</span>
        <span>13 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Схвалення плагінів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Плагіни провайдерів та інструментів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>1 з 6 (16.7%) / 9 з 21 (42.9%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Публікація плагінів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Тестування плагінів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 6 (0%) / 3 з 11 (27.3%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi і малі пристрої Linux - 4 області">
    <p className="maturity-readiness-summary">4 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Середовище виконання Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Продуктивність і діагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Віддалений доступ і автентифікація</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та сумісність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 12 (0%) / 0 з 12 (0%)</span>
        <span>12 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Безпека, автентифікація, сполучення та секрети - 6 областей">
    <p className="maturity-readiness-summary">2 частково перевірено / 4 потребують перевірки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Політика схвалення та захисні механізми інструментів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 3 з 6 (50%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Контроль доступу до каналів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Гігієна облікових даних і секретів</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково перевірено - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 5 з 11 (45.5%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сполучення пристроїв і Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 11 (0%) / 0 з 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Автентифікація Gateway і віддалений доступ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Довіра до Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перевірки - повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Сесія, пам’ять і рушій контексту - 9 областей">
    <p className="maturity-readiness-summary">2 потребують перегляду / 7 частково переглянуто</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Керування сесіями CLI і транскриптами</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Рушій контексту</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - Повна перевірка таксономії</span>
        </div>
        <span>0 з 2 (0%) / 4 з 7 (57.1%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Основні промпти та контекст</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - Повна перевірка таксономії</span>
        </div>
        <span>0 з 2 (0%) / 3 з 8 (37.5%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Історія між клієнтами та паритет сесій</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - Повна перевірка таксономії</span>
        </div>
        <span>0 з 2 (0%) / 2 з 5 (40%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Діагностика, обслуговування та відновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - Повна перевірка таксономії</span>
        </div>
        <span>0 з 3 (0%) / 4 з 10 (40%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Пам’ять</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - Повна перевірка таксономії</span>
        </div>
        <span>0 з 5 (0%) / 6 з 13 (46.2%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація сесій</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - Повна перевірка таксономії</span>
        </div>
        <span>0 з 2 (0%) / 1 з 4 (25%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Керування токенами</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - Повна перевірка таксономії</span>
        </div>
        <span>0 з 3 (0%) / 2 з 10 (20%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Збереження транскриптів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини в можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 6 (0%) / 0 з 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та операції каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставлення розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні елементи керування та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини в можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та операції каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставлення розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні елементи керування та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 8 (0%) / 0 з 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та операції каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 10 (0%) / 0 з 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставлення розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина в можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативні елементи керування та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - Повна перевірка таксономії</span>
        </div>
        <span>0 з 9 (0%) / 0 з 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Спостережуваність - 5 областей">
    <p className="maturity-readiness-summary">3 частково переглянуто / 2 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Збирання діагностики</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна валідація таксономії</span>
        </div>
        <span>1 з 8 (12.5%) / 3 з 10 (30%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Стан справності та відновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна валідація таксономії</span>
        </div>
        <span>1 з 12 (8.3%) / 5 з 18 (27.8%)</span>
        <span>13 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Журналювання</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Діагностика сеансів</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Експорт телеметрії</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна валідація таксономії</span>
        </div>
        <span>1 з 13 (7.7%) / 7 з 21 (33.3%)</span>
        <span>14 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Введення та команди</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 8 (0%) / 0 з 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Виконання локальної оболонки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Безпечне відтворення та виведення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Режими виконання</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 14 (0%) / 0 з 14 (0%)</span>
        <span>14 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Керування сеансами</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 3 (0%) / 0 з 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Голос і розмова в реальному часі - 6 областей">
    <p className="maturity-readiness-summary">6 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Розмова в нативному застосунку</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сеанси розмови в реальному часі</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 11 (0%) / 0 з 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Мовлення та транскрибування</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Спостережуваність розмови</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 5 (0%) / 0 з 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Провайдери розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 7 (0%) / 0 з 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голосове пробудження та маршрутизація</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 4 (0%) / 0 з 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Канал голосових викликів - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентифікація</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування каналу та операції</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставка розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 1 (0%) / 0 з 1 (0%)</span>
        <span>1 прогалина у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та розширений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос і виклики в реальному часі</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна валідація таксономії</span>
        </div>
        <span>0 з 2 (0%) / 0 з 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Супровідні поверхні watchOS - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доставка та відновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Поширення та підтримка</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 6 (0%) / 0 із 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Затвердження керівництвом</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сповіщення та відповіді</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Інтерфейс застосунку годинника</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 3 (0%) / 0 із 3 (0%)</span>
        <span>3 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Інструменти вебпошуку - 4 області">
    <p className="maturity-readiness-summary">2 потребують перегляду / 2 частково переглянуті</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Безпека мережі</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Постачальники пошуку</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна перевірка таксономії</span>
        </div>
        <span>2 із 19 (10.5%) / 2 із 19 (10.5%)</span>
        <span>17 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та діагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 9 (0%) / 0 із 9 (0%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступність інструментів і отримання даних</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна перевірка таксономії</span>
        </div>
        <span>2 із 11 (18.2%) / 3 із 12 (25%)</span>
        <span>9 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ та ідентичність</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 7 (0%) / 0 із 7 (0%)</span>
        <span>7 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування та операції каналу</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 5 (0%) / 0 із 5 (0%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизація та доставка розмов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 4 (0%) / 0 із 4 (0%)</span>
        <span>4 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медіа та насичений вміст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 2 (0%) / 0 із 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вбудовані елементи керування та затвердження</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 2 (0%) / 0 із 2 (0%)</span>
        <span>2 прогалини у можливостях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows через WSL2 - 6 областей">
    <p className="maturity-readiness-summary">5 потребують перегляду / 1 частково переглянута</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функції / ідентифікатори покриття</span><span>Подальші дії</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Браузер та інтерфейс керування</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 6 (0%) / 0 із 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 8 (0%) / 0 із 8 (0%)</span>
        <span>8 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Діагностика та відновлення</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частково переглянуто - повна перевірка таксономії</span>
        </div>
        <span>1 із 6 (16.7%) / 3 із 8 (37.5%)</span>
        <span>5 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ до Gateway та експозиція</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 11 (0%) / 0 із 11 (0%)</span>
        <span>11 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Життєвий цикл служби Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 10 (0%) / 0 із 10 (0%)</span>
        <span>10 прогалин у можливостях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Налаштування WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Потребує перегляду - повна перевірка таксономії</span>
        </div>
        <span>0 із 6 (0%) / 0 із 6 (0%)</span>
        <span>6 прогалин у можливостях</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Останнє оновлення: 2026-06-22
