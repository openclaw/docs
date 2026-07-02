---
summary: Оценки готовности релиза OpenClaw для областей продукта, интеграций и поддерживаемых рабочих процессов.
title: Оценочная карта зрелости
x-i18n:
    generated_at: "2026-07-02T08:39:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Оценочная карта зрелости

<div className="maturity-hero">
  <p className="maturity-kicker">готовность к релизу - сформировано на основе таксономии и данных QA</p>
  <p className="maturity-hero-title">Практический обзор того, что готово, что подтверждено и что еще требует работы.</p>
  <p>50 поверхностей - 281 область возможностей - детерминированное покрытие плюс качество и полнота, проверенные людьми.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Просмотреть поверхности</a> / <a href="#qa-evidence-summary">Изучить данные QA</a> / <a href="/ru/maturity/taxonomy">Прочитать таксономию</a></p>
</div>

## Для чего эта страница

Используйте эту страницу, чтобы ответить на один вопрос: какие поверхности OpenClaw являются надежными кандидатами для релиза и какие данные подтверждают эту оценку? Покрытие берется из детерминированных данных QA; качество и полнота поддерживаются как проверенные оценки зрелости.

## Краткий обзор

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Оценка зрелости</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Альфа</span>
      <span>Качество + полнота</span>
      <span>Покрытие: экспериментальное - 4%</span>
      <span>Качество: альфа - 64%</span>
      <span>Полнота: бета - 71%</span>
    </div>
  </div>
</div>

Покрытие намеренно строится на доказательствах: область не становится «готовой» только потому, что реализация существует. Оно не является входным параметром оценки зрелости, но OpenClaw стремится со временем поддерживать сквозное покрытие выше 90% для зрелых функций уровня «Стабильный» или выше.

## Диапазоны оценок

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Альфа</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Бета</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Стабильный</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Обзор поверхностей

<a id="surface-explorer" />

Поверхности упорядочены по уровню зрелости, полноте и качеству. Поддержка LTS показана в каждой строке, чтобы варианты, готовые к релизу, было легко сравнивать.

  <Tabs>
  <Tab title="Все поверхности">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхность</span><span>Покрытие</span><span>Качество</span><span>Полнота</span><span>Поддержка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Среда выполнения Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>13 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Хост Gateway на Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Хост Gateway на macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#android-app"><span className="maturity-surface-title">Приложение Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Приложение iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Среда выполнения агента</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Сеанс, память и движок контекста</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Фреймворк каналов</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Инструменты автоматизации браузера, exec и песочницы</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>3 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#observability"><span className="maturity-surface-title">Наблюдаемость</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Путь провайдера OpenAI и Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway Web-приложение</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Инструменты веб-поиска</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#plugins"><span className="maturity-surface-title">Плагины</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Безопасность, аутентификация, сопряжение и секреты</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Автоматизация: Cron, хуки, задачи, опрос</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Хостинг Docker и Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows через WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi и малые устройства Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Путь провайдера Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Полностью - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Полностью - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Путь провайдера Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage и BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">приложение-компаньон для macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Путь провайдера OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Понимание и генерация медиа</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Инструменты генерации изображений, видео и музыки</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Локальные провайдеры моделей: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Охват</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Нишевые размещенные провайдеры</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>3 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Охват</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Голос и общение в реальном времени</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Охват</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Охват</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Охват</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Охват</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Охват</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Нативный Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Хостинг Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, региональные каналы</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK приложения OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Путь установки Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Экспериментальный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Канал голосовых вызовов</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Экспериментальный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Сопутствующие поверхности watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Экспериментальный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Сопутствующее приложение Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Запланировано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Нативное сопутствующее приложение Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Запланировано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Ядро">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхность</span><span>Покрытие</span><span>Качество</span><span>Завершенность</span><span>Поддержка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Среда выполнения Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>13 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Среда выполнения агента</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Сессия, память и движок контекста</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Фреймворк каналов</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#observability"><span className="maturity-surface-title">Наблюдаемость</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Завершенность</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Веб-приложение Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>9 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Безопасность, аутентификация, сопряжение и секреты</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Автоматизация: Cron, хуки, задачи, опрос</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Понимание медиа и генерация медиа</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Голос и разговор в реальном времени</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Платформа">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхность</span><span>Покрытие</span><span>Качество</span><span>Полнота</span><span>Поддержка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">хост Linux Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частичная - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">хост macOS Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#android-app"><span className="maturity-surface-title">приложение Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>7 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#ios-app"><span className="maturity-surface-title">приложение iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильно</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильно</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Хостинг Docker и Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментально</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows через WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментально</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi и небольшие устройства на Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментально</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Сопутствующее приложение macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>8 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментально</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Нативная Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментально</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Хостинг Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментально</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Путь установки Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Экспериментальный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Сопутствующие поверхности watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Экспериментальный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Приложение-компаньон Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Запланировано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Нативное приложение-компаньон Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Запланировано</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Канал">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхность</span><span>Покрытие</span><span>Качество</span><span>Полнота</span><span>Поддержка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Стабильный</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Стабильный</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Полная - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Полная - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage и BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>6 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, региональные каналы</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Альфа</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Канал голосовых вызовов</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Экспериментальный</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Провайдер и инструмент">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Поверхность</span><span>Покрытие</span><span>Качество</span><span>Полнота</span><span>Поддержка</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Автоматизация браузера, exec и инструменты песочницы</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>3 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Путь провайдера OpenAI и Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Бета</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Бета</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Частично - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Инструменты веб-поиска</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Путь провайдера Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Путь провайдера Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Путь провайдера OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Инструменты генерации изображений, видео и музыки</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Локальные провайдеры моделей: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 областей</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ru/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Нишевые размещенные провайдеры</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 области</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Покрытие</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Экспериментальный</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Качество</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Полнота</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Альфа</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Нет</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Сводка свидетельств QA

Проверки ниже показывают, какие области оценочной таблицы были проверены свидетельствами профиля QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Полная проверка таксономии</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 проверок - 94 пройдены, 2 заблокированы</span>
    <span>0 из 281 (0%) областей - 20 из 1675 (1.2%) функций - 77 из 1665 (4.6%) идентификаторов покрытия</span>
  </div>
</div>

### Готовность по областям

Откройте поверхность, чтобы изучить состояние свидетельств для каждой категории. Список остается свернутым, чтобы страницу было удобно быстро просматривать.

<AccordionGroup>
  <Accordion title="Agent Runtime - 9 areas">
    <p className="maturity-readiness-summary">8 частично проверены / 1 требует проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Выполнение хода агента</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 7 из 24 (29.2%)</span>
        <span>17 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Внешние среды выполнения и субагенты</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 3 из 10 (30%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Выполнение размещенным провайдером</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>1 из 5 (20%) / 1 из 5 (20%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Локальные и самостоятельно размещаемые провайдеры</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Выбор модели и среды выполнения</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 2 из 8 (25%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Аутентификация провайдера</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 4 из 17 (23.5%)</span>
        <span>13 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Потоковая передача и ход выполнения</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 5 из 9 (55.6%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вызовы инструментов и обработка ответов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 15 из 23 (65.2%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Средства управления выполнением инструментов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 6 из 12 (50%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android app - 7 areas">
    <p className="maturity-readiness-summary">7 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка подключения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Среда выполнения устройства</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Распространение</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Захват медиа</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Мобильный чат</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic provider path - 5 areas">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа-входы</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Выбор модели и среды выполнения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Кэш подсказок и контекст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Аутентификация и восстановление провайдера</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Транспорт запросов и семантика хода</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Автоматизация: cron, хуки, задачи, опрос - 6 областей">
    <p className="maturity-readiness-summary">5 требуют проверки / 1 частично проверена</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Хуки автоматизации</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Фоновые задачи и потоки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Задания Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 15 (0%) / 0 из 15 (0%)</span>
        <span>15 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вход событий</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 15 (0%) / 0 из 15 (0%)</span>
        <span>15 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 1 из 7 (14.3%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Элементы управления опросом</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Автоматизация браузера, exec и инструменты sandbox - 3 области">
    <p className="maturity-readiness-summary">2 частично проверены / 1 требует проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Автоматизация браузера</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>1 из 8 (12.5%) / 1 из 8 (12.5%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox и политика инструментов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вызов и выполнение инструментов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>2 из 6 (33.3%) / 4 из 8 (50%)</span>
        <span>4 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Веб-приложение Gateway - 6 областей">
    <p className="maturity-readiness-summary">3 требуют проверки / 3 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ из браузера и доверие</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Разговор в браузере в реальном времени</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Интерфейс браузера</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 1 из 12 (8.3%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфигурация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Консоль оператора</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 1 из 12 (8.3%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Беседы WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 15 (0%) / 2 из 20 (10%)</span>
        <span>18 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Фреймворк каналов - 8 областей">
    <p className="maturity-readiness-summary">4 требуют проверки / 4 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Действия, команды и подтверждения каналов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 1 из 7 (14.3%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка бесед</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 5 из 27 (18.5%)</span>
        <span>22 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Поведение групповых веток и фоновых комнат</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 4 из 11 (36.4%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Входящий доступ и проверки идентичности</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа-вложения и расширенные данные каналов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Исходящая доставка и конвейер ответов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 8 из 21 (38.1%)</span>
        <span>13 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Состояние работоспособности и элементы управления оператора</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 области">
    <p className="maturity-readiness-summary">4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Обнаружение каталога</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Совместимость и доверие</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 12 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Жизненный цикл и работоспособность Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 26 (0%) / 0 из 26 (0%)</span>
        <span>26 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Публикация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 областей">
    <p className="maturity-readiness-summary">5 требуют проверки / 2 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Наблюдаемость CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>1 из 6 (16.7%) / 1 из 6 (16.7%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Управление службой Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 1 из 7 (14.3%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Онбординг и настройка аутентификации</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка Plugin и каналов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Обновления и апгрейды</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 областей">
    <p className="maturity-readiness-summary">6 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация каналов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка диалогов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 12 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и насыщенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и подтверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голосовая связь и звонки в реальном времени</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Хостинг Docker и Podman - 4 области">
    <p className="maturity-readiness-summary">3 требуют проверки / 1 частично проверена</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Песочница агента и инструменты</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Эксплуатация контейнеров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка контейнеров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Выпуск и проверка образов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>1 из 5 (20%) / 2 из 7 (28.6%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, региональные каналы - 4 области">
    <p className="maturity-readiness-summary">4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка разговоров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и насыщенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Среда выполнения Gateway - 13 областей">
    <p className="maturity-readiness-summary">9 требуют проверки / 4 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Утверждения и удаленное выполнение</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Аутентификация устройств и сопряжение</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Жизненный цикл Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>0 из 7 (0%) / 4 из 12 (33.3%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">RPC API Gateway и события</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>0 из 20 (0%) / 2 из 22 (9.1%)</span>
        <span>20 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Работоспособность, диагностика и исправление</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Размещенная веб-поверхность</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>1 из 4 (25%) / 1 из 4 (25%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сетевой доступ и обнаружение</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodes и удаленные возможности</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Совместимость протокола</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Роли и разрешения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Средства контроля безопасности</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket-соединение</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>1 из 8 (12.5%) / 1 из 8 (12.5%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 16 (0%) / 0 из 16 (0%)</span>
        <span>16 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка разговоров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и насыщенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и утверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 16 (0%) / 0 из 16 (0%)</span>
        <span>16 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Путь провайдера Google — 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Прямое выполнение Gemini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа, поиск и реальное время</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация моделей и конечные точки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Кэширование промптов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка провайдера и учетные данные</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Инструменты генерации изображений, видео и музыки — 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерация изображений</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и обнаружение медиа</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерация музыки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Жизненный цикл задачи и доставка</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 12 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерация видео</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage и BlueBubbles — 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка бесед</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и расширенное содержимое</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и подтверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Приложение iOS — 8 областей">
    <p className="maturity-readiness-summary">8 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Холст и экран</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Чат и сеансы</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Команды устройства</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Распространение</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и диагностика Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и общий доступ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Уведомления и фоновый режим</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Хостинг Kubernetes - 4 области">
    <p className="maturity-readiness-summary">4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и экспонирование</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Жизненный цикл кластера</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфигурация и секреты</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка развертывания</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Сопутствующее приложение Linux - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Распространение приложения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Чат и сеансы</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Возможности рабочего стола</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Подключение к Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Статус и диагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Хост Gateway на Linux - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Цели развертывания</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Диагностика и восстановление</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Среда выполнения Gateway и управление службой</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и обновления хоста</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Удаленный доступ и безопасность</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Локальные провайдеры моделей: Ollama, vLLM, SGLang, LM Studio - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Локальная память и эмбеддинги</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные Plugin провайдеров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сетевая безопасность и элементы управления промптами</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Совместимость среды выполнения, совместимой с OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка, жизненный цикл и диагностика провайдеров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 12 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Нишевые размещенные провайдеры - 3 области">
    <p className="maturity-readiness-summary">3 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Размещенные LLM-провайдеры</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 12 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Размещенные медиапровайдеры</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Операции провайдеров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 12 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="приложение-компаньон для macOS - 8 областей">
    <p className="maturity-readiness-summary">8 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Холст</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Локальная настройка</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные возможности</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Удаленные подключения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Удаленный WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Статус и настройки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос и разговор</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="хост macOS Gateway - 7 областей">
    <p className="maturity-readiness-summary">7 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Диагностика и наблюдаемость</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Жизненный цикл службы Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Интеграция с локальным Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Разрешения и нативные возможности</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Профили и изоляция</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Удаленный режим Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 областей">
    <p className="maturity-readiness-summary">6 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка разговоров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Шифрование и проверка</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и расширенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и подтверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat — 4 области">
    <p className="maturity-readiness-summary">4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка разговоров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и насыщенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Понимание медиа и генерация медиа — 6 областей">
    <p className="maturity-readiness-summary">4 требуют проверки / 2 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Обработка медиа в каналах</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфигурация медиа</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерация медиа</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено — полная проверка таксономии</span>
        </div>
        <span>1 из 17 (5.9%) / 1 из 19 (5.3%)</span>
        <span>18 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Прием и доступ к медиа</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Понимание медиа</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено — полная проверка таксономии</span>
        </div>
        <span>0 из 12 (0%) / 1 из 14 (7.1%)</span>
        <span>13 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доставка преобразования текста в речь</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams — 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка разговоров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и насыщенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и утверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Нативная Windows — 4 области">
    <p className="maturity-readiness-summary">4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Управление Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сетевое взаимодействие</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Обновления</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Нативное сопутствующее приложение Windows - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сеансы чата</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Инструменты рабочего стола и разрешения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Подключение к Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Установка и обновления</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Статус и восстановление</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Путь установки Nix - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Активация и UX приложения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Конфигурация и состояние</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Передача установки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Жизненный цикл Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Среда выполнения сервиса и защитные проверки</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Путь провайдера OpenAI и Codex - 5 областей">
    <p className="maturity-readiness-summary">2 требуют проверки / 3 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Изображения и мультимодальный ввод</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Модель и аутентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>1 из 6 (16.7%) / 4 из 9 (44.4%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативная обвязка Codex</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 4 из 9 (44.4%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ответы и совместимость инструментов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>1 из 4 (25%) / 2 из 5 (40%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос и аудио в реальном времени</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="SDK приложения OpenClaw - 6 областей">
    <p className="maturity-readiness-summary">5 требуют проверки / 1 частично проверена</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Диалоги с агентом</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Клиентский API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Совместимость</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">События и подтверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ к Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Вспомогательные средства ресурсов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 1 из 6 (16.7%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Путь провайдера OpenRouter - 4 области">
    <p className="maturity-readiness-summary">4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Последующие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Среда выполнения чата и нормализация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 15 (0%) / 0 из 15 (0%)</span>
        <span>15 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Генерация медиа и речь</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Восстановление и диагностика провайдера</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка провайдера и аутентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 14 (0%) / 0 из 14 (0%)</span>
        <span>14 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin - 9 областей">
    <p className="maturity-readiness-summary">6 требуют проверки / 3 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Последующие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Создание и упаковка Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Встроенные Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Канальные Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Установка и запуск Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 7 из 20 (35%)</span>
        <span>13 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Утверждения Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Провайдерские и инструментальные Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>1 из 6 (16.7%) / 9 из 21 (42.9%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Публикация Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Тестирование Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 3 из 11 (27.3%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi и небольшие устройства Linux - 4 области">
    <p className="maturity-readiness-summary">4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Последующие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Среда выполнения Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Производительность и диагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Удаленный доступ и аутентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и совместимость</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 12 (0%) / 0 из 12 (0%)</span>
        <span>12 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Безопасность, аутентификация, сопряжение и секреты - 6 областей">
    <p className="maturity-readiness-summary">2 частично проверены / 4 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Последующие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Политика утверждений и защитные механизмы инструментов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 3 из 6 (50%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Контроль доступа к каналам</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Гигиена учетных данных и секретов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 5 из 11 (45.5%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сопряжение устройств и Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Аутентификация Gateway и удаленный доступ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доверие к Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Сеанс, память и движок контекста - 9 областей">
    <p className="maturity-readiness-summary">2 требуют проверки / 7 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Управление сеансами CLI и стенограммами</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Движок контекста</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 4 из 7 (57.1%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Основные промпты и контекст</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 3 из 8 (37.5%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">История между клиентами и паритет сеансов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 2 из 5 (40%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Диагностика, обслуживание и восстановление</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 4 из 10 (40%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Память</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 6 из 13 (46.2%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация сеансов</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 1 из 4 (25%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Управление токенами</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 2 из 10 (20%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сохранение стенограмм</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка канала и операции</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка диалогов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и расширенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и подтверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка канала и операции</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка диалогов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и расширенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и подтверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка канала и операции</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка диалогов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и расширенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и подтверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки - полная проверка таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Наблюдаемость - 5 областей">
    <p className="maturity-readiness-summary">3 частично проверено / 2 требуется проверка</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сбор диагностических данных</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>1 из 8 (12.5%) / 3 из 10 (30%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Работоспособность и восстановление</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>1 из 12 (8.3%) / 5 из 18 (27.8%)</span>
        <span>13 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ведение журналов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Диагностика сеансов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Экспорт телеметрии</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено - Полная проверка таксономии</span>
        </div>
        <span>1 из 13 (7.7%) / 7 из 21 (33.3%)</span>
        <span>14 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 областей">
    <p className="maturity-readiness-summary">5 требуется проверка</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ввод и команды</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Локальное выполнение в оболочке</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Отрисовка и безопасность вывода</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Режимы выполнения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 14 (0%) / 0 из 14 (0%)</span>
        <span>14 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Управление сеансами</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Голос и разговор в реальном времени - 6 областей">
    <p className="maturity-readiness-summary">6 требуется проверка</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Разговор в нативном приложении</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сеансы разговора в реальном времени</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Речь и транскрибирование</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Наблюдаемость разговора</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Поставщики разговора</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голосовая активация и маршрутизация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Канал голосовых вызовов - 5 областей">
    <p className="maturity-readiness-summary">5 требуется проверка</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / идентификаторы покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка канала и операции</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка бесед</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 1 (0%) / 0 из 1 (0%)</span>
        <span>1 пробел в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и расширенное содержимое</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Голос в реальном времени и вызовы</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требуется проверка - Полная проверка таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="сопутствующие поверхности watchOS — 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доставка и восстановление</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Распространение и поддержка</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Утверждения исполнителем</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Уведомления и ответы</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Интерфейс приложения для часов</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 3 (0%) / 0 из 3 (0%)</span>
        <span>3 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Инструменты веб-поиска — 4 области">
    <p className="maturity-readiness-summary">2 требуют проверки / 2 частично проверены</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Сетевая безопасность</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Поставщики поиска</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено — полная валидация таксономии</span>
        </div>
        <span>2 из 19 (10.5%) / 2 из 19 (10.5%)</span>
        <span>17 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и диагностика</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 9 (0%) / 0 из 9 (0%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступность инструментов и получение данных</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено — полная валидация таксономии</span>
        </div>
        <span>2 из 11 (18.2%) / 3 из 12 (25%)</span>
        <span>9 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp — 5 областей">
    <p className="maturity-readiness-summary">5 требуют проверки</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ и идентификация</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 7 (0%) / 0 из 7 (0%)</span>
        <span>7 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка и эксплуатация канала</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 5 (0%) / 0 из 5 (0%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Маршрутизация и доставка разговоров</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 4 (0%) / 0 из 4 (0%)</span>
        <span>4 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Медиа и расширенный контент</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Нативные элементы управления и утверждения</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 2 (0%) / 0 из 2 (0%)</span>
        <span>2 пробела в возможностях</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows через WSL2 — 6 областей">
    <p className="maturity-readiness-summary">5 требуют проверки / 1 частично проверена</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Область</span><span>Функции / ID покрытия</span><span>Дальнейшие действия</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Браузер и интерфейс управления</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 8 (0%) / 0 из 8 (0%)</span>
        <span>8 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Диагностика и восстановление</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Частично проверено — полная валидация таксономии</span>
        </div>
        <span>1 из 6 (16.7%) / 3 из 8 (37.5%)</span>
        <span>5 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Доступ к Gateway и экспонирование</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 11 (0%) / 0 из 11 (0%)</span>
        <span>11 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Жизненный цикл службы Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 10 (0%) / 0 из 10 (0%)</span>
        <span>10 пробелов в возможностях</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Настройка WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Требует проверки — полная валидация таксономии</span>
        </div>
        <span>0 из 6 (0%) / 0 из 6 (0%)</span>
        <span>6 пробелов в возможностях</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Последнее обновление: 2026-06-22
