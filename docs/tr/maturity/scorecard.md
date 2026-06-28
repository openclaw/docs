---
summary: OpenClaw ürün alanları, entegrasyonlar ve desteklenen iş akışları için sürüm hazırlık puanları.
title: Olgunluk puan kartı
x-i18n:
    generated_at: "2026-06-28T00:45:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 916f070ca42778dc1cc41e47cdb4ace502f073c4e888f21526b762226a856d40
    source_path: maturity/scorecard.md
    workflow: 16
---

# Olgunluk puan kartı

<div className="maturity-hero">
  <p className="maturity-kicker">yayın hazırlığı - taksonomi + QA kanıtlarından oluşturuldu</p>
  <p className="maturity-hero-title">Neyin hazır, neyin kanıtlanmış ve neyin hâlâ çalışma gerektirdiğine dair pratik bir görünüm.</p>
  <p>50 yüzey - 281 yetenek alanı - deterministik kapsam artı insan incelemesinden geçmiş kalite ve eksiksizlik.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Yüzeylere göz at</a> / <a href="#qa-evidence-summary">QA kanıtını incele</a> / <a href="/tr/maturity/taxonomy">Taksonomiyi oku</a></p>
</div>

## Bu sayfa ne için kullanılır?

Bu sayfayı tek bir soruya yanıt vermek için kullanın: hangi OpenClaw yüzeyleri bir yayın için güvenilir seçeneklerdir ve bu yargıyı hangi kanıt destekler? Kapsam deterministik QA kanıtlarından gelir; kalite ve eksiksizlik, incelenmiş olgunluk puanları olarak korunur.

## Bir bakışta

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">67%</span>
      <span>Olgunluk puanı</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "67" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alfa</span>
      <span>Kalite + eksiksizlik</span>
      <span>Kapsam Deneysel - %4</span>
      <span>Kalite Alfa - %63</span>
      <span>Eksiksizlik Beta - %70</span>
    </div>
  </div>
</div>

Kapsam bilinçli olarak kanıt odaklıdır: bir alan yalnızca uygulama mevcut olduğu için "hazır" hale gelmez. Olgunluk puanı için bir girdi değildir, ancak OpenClaw zaman içinde olgun Kararlı veya daha iyi özellikler için uçtan uca kapsamı %90'ın üzerinde tutmayı hedefler.

## Puan bantları

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alfa</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Kararlı</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Yüzey gezgini

<a id="surface-explorer" />

Yüzeyler olgunluk düzeyine, eksiksizliğe ve kaliteye göre sıralanır. Yayına hazır seçeneklerin kolayca karşılaştırılabilmesi için LTS desteği her satırın yanında gösterilir.

  <Tabs>
  <Tab title="Tüm yüzeyler">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Yüzey</span><span>Kapsam</span><span>Kalite</span><span>Tamamlanma</span><span>Destek</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>7 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway çalışma zamanı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>13 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway ana makinesi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway ana makinesi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>7 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Ajan Çalışma Zamanı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Oturum, bellek ve bağlam motoru</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Kanal çerçevesi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Tarayıcı otomasyonu, yürütme ve korumalı alan araçları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#observability"><span className="maturity-surface-title">Gözlemlenebilirlik</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI ve Codex sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway Web Uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Web arama araçları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#plugins"><span className="maturity-surface-title">Pluginler</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Güvenlik, kimlik doğrulama, eşleştirme ve gizli bilgiler</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Otomasyon: Cron, kancalar, görevler, yoklama</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker ve Podman barındırma</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2 üzerinden Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi ve küçük Linux cihazları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Tam - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Tam - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage ve BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS eşlikçi uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Medya anlama ve medya üretimi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Görüntü, video ve müzik üretim araçları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Yerel model sağlayıcıları: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Uzun kuyruk barındırılan sağlayıcılar</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Ses ve gerçek zamanlı konuşma</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>7 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Yerel Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes barındırma</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, bölgesel kanallar</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Eksiksizlik</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw Uygulama SDK'sı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>8 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix kurulum yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Sesli Arama kanalı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS eşlikçi yüzeyleri</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux eşlikçi uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planlanan</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Yerel Windows eşlikçi uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planlanan</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Core">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Yüzey</span><span>Kapsam</span><span>Kalite</span><span>Tamamlanma</span><span>Destek</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>7 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway çalışma zamanı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>13 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Ajan Çalışma Zamanı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Oturum, bellek ve bağlam motoru</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Kanal çerçevesi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#observability"><span className="maturity-surface-title">Gözlemlenebilirlik</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway Web Uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#plugins"><span className="maturity-surface-title">Pluginler</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Güvenlik, kimlik doğrulama, eşleştirme ve sırlar</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Otomasyon: Cron, kancalar, görevler, yoklama</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Medya anlama ve medya üretimi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Ses ve gerçek zamanlı konuşma</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw Uygulama SDK'sı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Platform">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Yüzey</span><span>Kapsam</span><span>Kalite</span><span>Tamlık</span><span>Destek</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway ana makinesi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway ana makinesi</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>7 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker ve Podman barındırma</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2 üzerinden Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi ve küçük Linux cihazları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS eşlikçi uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>7 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Yerel Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes barındırma</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>8 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix kurulum yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS eşlikçi yüzeyleri</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux eşlikçi uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planlandı</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Yerel Windows eşlikçi uygulaması</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Planlandı</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kanal">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Yüzey</span><span>Kapsam</span><span>Kalite</span><span>Tamamlanma</span><span>Destek</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Kararlı</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Kararlı</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Tam - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Tam - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage ve BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanmışlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, bölgesel kanallar</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Sesli Arama kanalı</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Deneysel</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Sağlayıcı ve araç">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Yüzey</span><span>Kapsam</span><span>Kalite</span><span>Tamlık</span><span>Destek</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Tarayıcı otomasyonu, exec ve sandbox araçları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI ve Codex sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Kısmi - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Web arama araçları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter sağlayıcı yolu</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Görüntü, video ve müzik üretme araçları</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Yerel model sağlayıcıları: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamamlanma</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/tr/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Uzun kuyruklu barındırılan sağlayıcılar</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 alan</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kapsam</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Deneysel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kalite</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Tamlık</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Yok</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## QA kanıt özeti

Aşağıdaki kontroller, QA profil kanıtlarıyla hangi puan kartı alanlarının çalıştırıldığını gösterir.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Tam taksonomi doğrulaması</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 kontrol - 94 geçti, 2 engellendi</span>
    <span>281 alanın 0'ı (0%) - 1675 özelliğin 20'si (1.2%) - 1665 kapsam kimliğinin 77'si (4.6%)</span>
  </div>
</div>

### Alana göre hazır olma durumu

Her kategorinin kanıt durumunu incelemek için bir yüzey açın. Liste daraltılmış kalır, böylece sayfa ilk bakışta kullanışlı olmaya devam eder.

<AccordionGroup>
  <Accordion title="Ajan Çalışma Zamanı - 9 alan">
    <p className="maturity-readiness-summary">8 kısmen gözden geçirildi / 1 gözden geçirilmeli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ajan Tur Yürütmesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'ün 0'ı (0%) / 24'ün 7'si (29.2%)</span>
        <span>17 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Harici Çalışma Zamanları ve Alt Ajanlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'ün 0'ı (0%) / 10'un 3'ü (30%)</span>
        <span>7 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Barındırılan Sağlayıcı Yürütmesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'in 1'i (20%) / 5'in 1'i (20%)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel ve Kendi Barındırılan Sağlayıcılar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'in 0'ı (0%) / 5'in 0'ı (0%)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model ve Çalışma Zamanı Seçimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'ün 0'ı (0%) / 8'in 2'si (25%)</span>
        <span>6 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı Kimlik Doğrulaması</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>10'un 0'ı (0%) / 17'nin 4'ü (23.5%)</span>
        <span>13 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akış ve İlerleme</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'nin 0'ı (0%) / 9'un 5'i (55.6%)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Araç Çağrıları ve Yanıt İşleme</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'ün 0'ı (0%) / 23'ün 15'i (65.2%)</span>
        <span>8 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Araç Yürütme Denetimleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen gözden geçirildi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6'nın 0'ı (0%) / 12'nin 6'sı (50%)</span>
        <span>6 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android uygulaması - 7 alan">
    <p className="maturity-readiness-summary">7 gözden geçirilmeli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bağlantı Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'in 0'ı (0%) / 1'in 0'ı (0%)</span>
        <span>1 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cihaz Çalışma Zamanı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'nin 0'ı (0%) / 2'nin 0'ı (0%)</span>
        <span>2 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dağıtım</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'ün 0'ı (0%) / 3'ün 0'ı (0%)</span>
        <span>3 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Yakalama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'in 0'ı (0%) / 1'in 0'ı (0%)</span>
        <span>1 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mobil Sohbet</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'in 0'ı (0%) / 1'in 0'ı (0%)</span>
        <span>1 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ayarlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'in 0'ı (0%) / 1'in 0'ı (0%)</span>
        <span>1 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ses</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'in 0'ı (0%) / 1'in 0'ı (0%)</span>
        <span>1 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic sağlayıcı yolu - 5 alan">
    <p className="maturity-readiness-summary">5 gözden geçirilmeli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Girdileri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'ün 0'ı (0%) / 4'ün 0'ı (0%)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model ve Çalışma Zamanı Seçimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>10'un 0'ı (0%) / 12'nin 0'ı (0%)</span>
        <span>12 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İstem Önbelleği ve Bağlam</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'in 0'ı (0%) / 5'in 0'ı (0%)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı Kimlik Doğrulaması ve Kurtarma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>9'un 0'ı (0%) / 9'un 0'ı (0%)</span>
        <span>9 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İstek Aktarımı ve Tur Semantiği</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Gözden geçirilmeli - Tam taksonomi doğrulaması</span>
        </div>
        <span>10'un 0'ı (0%) / 10'un 0'ı (0%)</span>
        <span>10 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Otomasyon: Cron, kancalar, görevler, yoklama - 6 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekli / 1 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Otomasyon Kancaları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (%0) / 11 üzerinden 0 (%0)</span>
        <span>11 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Arka Plan Görevleri ve Akışları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron İşleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>15 üzerinden 0 (%0) / 15 üzerinden 0 (%0)</span>
        <span>15 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Olay Girişi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>15 üzerinden 0 (%0) / 15 üzerinden 0 (%0)</span>
        <span>15 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 7 üzerinden 1 (%14,3)</span>
        <span>6 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yoklama Denetimleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Tarayıcı otomasyonu, yürütme ve korumalı alan araçları - 3 alan">
    <p className="maturity-readiness-summary">2 kısmen incelendi / 1 inceleme gerekli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tarayıcı Otomasyonu</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 1 (%12,5) / 8 üzerinden 1 (%12,5)</span>
        <span>7 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Korumalı Alan ve Araç Politikası</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Araç Çağırma ve Yürütme</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 2 (%33,3) / 8 üzerinden 4 (%50)</span>
        <span>4 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway Web Uygulaması - 6 alan">
    <p className="maturity-readiness-summary">3 inceleme gerekli / 3 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tarayıcı Erişimi ve Güven</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tarayıcı Gerçek Zamanlı Konuşması</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tarayıcı Arayüzü</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 12 üzerinden 1 (%8,3)</span>
        <span>11 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yapılandırma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operatör Konsolu</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 12 üzerinden 1 (%8,3)</span>
        <span>11 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat Konuşmaları</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>15 üzerinden 0 (%0) / 20 üzerinden 2 (%10)</span>
        <span>18 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kanal çerçevesi - 8 alan">
    <p className="maturity-readiness-summary">4 inceleme gerekli / 4 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Eylemleri, Komutları ve Onayları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 7 üzerinden 1 (%14,3)</span>
        <span>6 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 27 üzerinden 5 (%18,5)</span>
        <span>22 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Grup Dizisi ve Ortam Odası Davranışı</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 11 üzerinden 4 (%36,4)</span>
        <span>7 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gelen Erişim ve Kimlik Kapıları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Ekleri ve Zengin Kanal Verileri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giden Teslim ve Yanıt İşlem Hattı</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 21 üzerinden 8 (%38,1)</span>
        <span>13 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Durum Sağlığı ve Operatör Denetimleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 alan">
    <p className="maturity-readiness-summary">4 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Katalog Keşfi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 5 üzerinden 0 (0%)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uyumluluk ve Güven</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (0%) / 12 üzerinden 0 (0%)</span>
        <span>12 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Yaşam Döngüsü ve Sağlığı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>26 üzerinden 0 (0%) / 26 üzerinden 0 (0%)</span>
        <span>26 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yayınlama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (0%) / 7 üzerinden 0 (0%)</span>
        <span>7 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor / 2 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI Gözlemlenebilirliği</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 5 üzerinden 0 (0%)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 1 (16.7%) / 6 üzerinden 1 (16.7%)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (0%) / 10 üzerinden 0 (0%)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Hizmet Yönetimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 7 üzerinden 1 (14.3%)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Başlangıç Yapılandırması ve Kimlik Doğrulama Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 5 üzerinden 0 (0%)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ve Kanal Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 5 üzerinden 0 (0%)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Güncellemeler ve Yükseltmeler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 5 üzerinden 0 (0%)</span>
        <span>5 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 alan">
    <p className="maturity-readiness-summary">6 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (0%) / 6 üzerinden 0 (0%)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve Operasyonlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (0%) / 10 üzerinden 0 (0%)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslimat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (0%) / 12 üzerinden 0 (0%)</span>
        <span>12 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (0%) / 1 üzerinden 0 (0%)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Denetimler ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 5 üzerinden 0 (0%)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerçek Zamanlı Ses ve Çağrılar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (0%) / 5 üzerinden 0 (0%)</span>
        <span>5 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker ve Podman barındırma - 4 alan">
    <p className="maturity-readiness-summary">3 inceleme gerekiyor / 1 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ajan Sandbox'ı ve Araçlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (0%) / 3 üzerinden 0 (0%)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konteyner Operasyonları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (0%) / 11 üzerinden 0 (0%)</span>
        <span>11 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konteyner Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (0%) / 6 üzerinden 0 (0%)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İmaj Sürümü ve Doğrulama</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 1 (20%) / 7 üzerinden 2 (28.6%)</span>
        <span>5 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, bölgesel kanallar - 4 alan">
    <p className="maturity-readiness-summary">4 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve Operasyonları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway çalışma zamanı - 13 alan">
    <p className="maturity-readiness-summary">9 inceleme gerekiyor / 4 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Onaylar ve Uzaktan Yürütme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cihaz Kimlik Doğrulaması ve Eşleştirme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Yaşam Döngüsü</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 12 üzerinden 4 (%33,3)</span>
        <span>8 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway RPC API'leri ve Olayları</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>20 üzerinden 0 (%0) / 22 üzerinden 2 (%9,1)</span>
        <span>20 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlık, Tanılama ve Onarım</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Barındırılan Web Yüzeyi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API'leri</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 1 (%25) / 4 üzerinden 1 (%25)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ağ Erişimi ve Keşif</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Node'lar ve Uzak Yetenekler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 0 (%0) / 8 üzerinden 0 (%0)</span>
        <span>8 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Protokol Uyumluluğu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Roller ve İzinler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Güvenlik Denetimleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket Bağlantısı</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 1 (%12,5) / 8 üzerinden 1 (%12,5)</span>
        <span>7 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (%0) / 11 üzerinden 0 (%0)</span>
        <span>11 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve Operasyonları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>16 üzerinden 0 (%0) / 16 üzerinden 0 (%0)</span>
        <span>16 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Denetimler ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>16 üzerinden 0 (%0) / 16 üzerinden 0 (%0)</span>
        <span>16 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google sağlayıcı yolu - 5 alan">
    <p className="maturity-readiness-summary">5 için inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doğrudan Gemini Çalışma Zamanı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya, Arama ve Gerçek Zamanlı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model Yönlendirme ve Uç Noktalar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İstem Önbelleğe Alma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı Kurulumu ve Kimlik Bilgileri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Görsel, video ve müzik oluşturma araçları - 5 alan">
    <p className="maturity-readiness-summary">5 için inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Görsel Oluşturma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Yönlendirme ve Keşif</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Müzik Oluşturma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Görev Yaşam Döngüsü ve Teslimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (%0) / 12 üzerinden 0 (%0)</span>
        <span>12 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Video Oluşturma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (%0) / 11 üzerinden 0 (%0)</span>
        <span>11 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage ve BlueBubbles - 5 alan">
    <p className="maturity-readiness-summary">5 için inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve Operasyonlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (%0) / 11 üzerinden 0 (%0)</span>
        <span>11 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Kontroller ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS uygulaması - 8 alan">
    <p className="maturity-readiness-summary">8 için inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tuval ve Ekran</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sohbet ve Oturumlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cihaz Komutları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2 üzerinden 0 (%0) / 2 üzerinden 0 (%0)</span>
        <span>2 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dağıtım</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Kurulumu ve Tanılama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Paylaşım</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bildirimler ve Arka Plan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ses</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes barındırma - 4 alan">
    <p className="maturity-readiness-summary">4 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Maruz Bırakma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Küme Yaşam Döngüsü</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yapılandırma ve Gizli Bilgiler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dağıtım Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux eşlikçi uygulaması - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uygulama Dağıtımı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sohbet ve Oturumlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Masaüstü Yetenekleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Bağlantısı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Durum ve Tanılama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux Gateway ana makinesi - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dağıtım Hedefleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tanılama ve Onarım</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Çalışma Zamanı ve Hizmet Denetimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ana Makine Kurulumu ve Güncellemeler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uzaktan Erişim ve Güvenlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Yerel model sağlayıcıları: Ollama, vLLM, SGLang, LM Studio - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Bellek ve Embedding'ler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Sağlayıcı Plugin'leri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ağ Güvenliği ve İstem Denetimleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2 üzerinden 0 (%0) / 2 üzerinden 0 (%0)</span>
        <span>2 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI Uyumlu Çalışma Zamanı Uyumluluğu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 0 (%0) / 8 üzerinden 0 (%0)</span>
        <span>8 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı Kurulumu, Yaşam Döngüsü ve Tanılama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (%0) / 12 üzerinden 0 (%0)</span>
        <span>12 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Uzun kuyruklu barındırılan sağlayıcılar - 3 alan">
    <p className="maturity-readiness-summary">3 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Barındırılan LLM Sağlayıcıları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (%0) / 12 üzerinden 0 (%0)</span>
        <span>12 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Barındırılan Medya Sağlayıcıları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 0 (%0) / 8 üzerinden 0 (%0)</span>
        <span>8 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı Operasyonları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (%0) / 12 üzerinden 0 (%0)</span>
        <span>12 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS yardımcı uygulaması - 8 alan">
    <p className="maturity-readiness-summary">8 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tuval</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Kurulum</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Yetenekler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uzak Bağlantılar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uzak Web Sohbeti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Durum ve Ayarlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ses ve Konuşma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Web Sohbeti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS Gateway ana makinesi - 7 alan">
    <p className="maturity-readiness-summary">7 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tanılama ve Gözlemlenebilirlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Hizmet Yaşam Döngüsü</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Gateway Entegrasyonu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İzinler ve Yerel Yetenekler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Profiller ve Yalıtım</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uzak Gateway Modu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 alan">
    <p className="maturity-readiness-summary">6 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve İşlemleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Şifreleme ve Doğrulama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Kontroller ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 alan">
    <p className="maturity-readiness-summary">4 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve Operasyonları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Medya anlama ve medya üretimi - 6 alan">
    <p className="maturity-readiness-summary">4 inceleme gerekiyor / 2 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Medyası İşleme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Yapılandırması</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1 üzerinden 0 (%0) / 1 üzerinden 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Üretimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>17 üzerinden 1 (%5.9) / 19 üzerinden 1 (%5.3)</span>
        <span>18 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Alımı ve Erişimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 0 (%0) / 8 üzerinden 0 (%0)</span>
        <span>8 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Anlama</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (%0) / 14 üzerinden 1 (%7.1)</span>
        <span>13 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Metinden Konuşmaya Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2 üzerinden 0 (%0) / 2 üzerinden 0 (%0)</span>
        <span>2 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve Operasyonları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Kontroller ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Yerel Windows - 4 alan">
    <p className="maturity-readiness-summary">4 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Yönetimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (%0) / 11 üzerinden 0 (%0)</span>
        <span>11 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ağ İletişimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Güncellemeler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Yerel Windows eşlikçi uygulaması - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sohbet Oturumları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'de 0 (%0) / 2'de 0 (%0)</span>
        <span>2 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Masaüstü Araçları ve İzinler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10'da 0 (%0) / 10'da 0 (%0)</span>
        <span>10 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Bağlantısı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'te 0 (%0) / 3'te 0 (%0)</span>
        <span>3 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kurulum ve Güncellemeler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (%0) / 4'te 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Durum ve Onarım</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (%0) / 5'te 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix kurulum yolu - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Etkinleştirme ve Uygulama UX'i</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7'de 0 (%0) / 7'de 0 (%0)</span>
        <span>7 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yapılandırma ve Durum</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7'de 0 (%0) / 7'de 0 (%0)</span>
        <span>7 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kurulum Devri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (%0) / 4'te 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Yaşam Döngüsü</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (%0) / 4'te 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hizmet Çalışma Zamanı ve Korumalar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8'de 0 (%0) / 8'de 0 (%0)</span>
        <span>8 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI ve Codex sağlayıcı yolu - 5 alan">
    <p className="maturity-readiness-summary">2 inceleme gerekiyor / 3 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Görüntü ve Çok Modlu Girdi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'de 0 (%0) / 2'de 0 (%0)</span>
        <span>2 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model ve Kimlik Doğrulama</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6'da 1 (%16,7) / 9'da 4 (%44,4)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Codex Harness</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'de 0 (%0) / 9'da 4 (%44,4)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yanıtlar ve Araç Uyumluluğu</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 1 (%25) / 5'te 2 (%40)</span>
        <span>3 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ses ve Gerçek Zamanlı Ses</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'de 0 (%0) / 2'de 0 (%0)</span>
        <span>2 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw Uygulama SDK'sı - 6 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor / 1 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ajan Konuşmaları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6'da 0 (%0) / 6'da 0 (%0)</span>
        <span>6 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İstemci API'si</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (%0) / 4'te 0 (%0)</span>
        <span>4 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uyumluluk</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (%0) / 5'te 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Olaylar ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (%0) / 5'te 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Erişimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (%0) / 5'te 0 (%0)</span>
        <span>5 yetenek boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kaynak Yardımcıları</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (%0) / 6'da 1 (%16,7)</span>
        <span>5 yetenek boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter sağlayıcı yolu - 4 alan">
    <p className="maturity-readiness-summary">4 için inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sohbet Çalışma Zamanı ve Normalleştirme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>15 üzerinden 0 (%0) / 15 üzerinden 0 (%0)</span>
        <span>15 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya Oluşturma ve Konuşma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı Kurtarma ve Tanılama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı Kurulumu ve Kimlik Doğrulama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>14 üzerinden 0 (%0) / 14 üzerinden 0 (%0)</span>
        <span>14 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin'ler - 9 alan">
    <p className="maturity-readiness-summary">6 için inceleme gerekiyor / 3 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin yazma ve paketleme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 0 (%0) / 8 üzerinden 0 (%0)</span>
        <span>8 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Paketle gelen Plugin'ler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas Plugin'i</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Plugin'leri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin'leri kurma ve çalıştırma</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 20 üzerinden 7 (%35)</span>
        <span>13 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin onayları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlayıcı ve araç Plugin'leri</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 1 (%16,7) / 21 üzerinden 9 (%42,9)</span>
        <span>12 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin'leri yayımlama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin'leri test etme</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 11 üzerinden 3 (%27,3)</span>
        <span>8 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi ve küçük Linux cihazları - 4 alan">
    <p className="maturity-readiness-summary">4 için inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Çalışma Zamanı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Performans ve Tanılama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uzaktan Erişim ve Kimlik Doğrulama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kurulum ve Uyumluluk</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>12 üzerinden 0 (%0) / 12 üzerinden 0 (%0)</span>
        <span>12 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Güvenlik, kimlik doğrulama, eşleştirme ve sırlar - 6 alan">
    <p className="maturity-readiness-summary">2 kısmen incelendi / 4 için inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Onay Politikası ve Araç Güvenceleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>2 üzerinden 0 (%0) / 6 üzerinden 3 (%50)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Erişim Denetimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kimlik Bilgisi ve Sır Hijyeni</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 11 üzerinden 5 (%45,5)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cihaz ve Node Eşleştirme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (%0) / 11 üzerinden 0 (%0)</span>
        <span>11 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Kimlik Doğrulaması ve Uzaktan Erişim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Güveni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2 üzerinden 0 (%0) / 2 üzerinden 0 (%0)</span>
        <span>2 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Oturum, bellek ve bağlam motoru - 9 alan">
    <p className="maturity-readiness-summary">2 inceleme gerekiyor / 7 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI Oturum ve Döküm Yönetimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'den 0 (%0) / 2'den 0 (%0)</span>
        <span>2 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bağlam Motoru</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'den 0 (%0) / 7'den 4 (%57,1)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Çekirdek İstemler ve Bağlam</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'den 0 (%0) / 8'den 3 (%37,5)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Çapraz İstemci Geçmişi ve Oturum Eşdeğerliği</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'den 0 (%0) / 5'ten 2 (%40)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tanılama, Bakım ve Kurtarma</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'ten 0 (%0) / 10'dan 4 (%40)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bellek</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'ten 0 (%0) / 13'ten 6 (%46,2)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Oturum Yönlendirme</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'den 0 (%0) / 4'ten 1 (%25)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Token Yönetimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'ten 0 (%0) / 10'dan 2 (%20)</span>
        <span>8 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Döküm Kalıcılığı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'den 0 (%0) / 2'den 0 (%0)</span>
        <span>2 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6'dan 0 (%0) / 6'dan 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve İşlemleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7'den 0 (%0) / 7'den 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'den 0 (%0) / 1'den 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7'den 0 (%0) / 7'den 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Denetimler ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'ten 0 (%0) / 3'ten 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'den 0 (%0) / 1'den 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve İşlemleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10'dan 0 (%0) / 10'dan 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'ten 0 (%0) / 5'ten 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'den 0 (%0) / 1'den 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Denetimler ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8'den 0 (%0) / 8'den 0 (%0)</span>
        <span>8 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10'dan 0 (%0) / 10'dan 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve İşlemleri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10'dan 0 (%0) / 10'dan 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'den 0 (%0) / 1'den 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'den 0 (%0) / 1'den 0 (%0)</span>
        <span>1 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Denetimler ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9'dan 0 (%0) / 9'dan 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gözlemlenebilirlik - 5 alan">
    <p className="maturity-readiness-summary">3 kısmen incelendi / 2 inceleme gerekli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsama kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tanılama Verilerini Toplama</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>8'de 1 (12.5%) / 10'da 3 (30%)</span>
        <span>7 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sağlık ve Onarım</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>12'de 1 (8.3%) / 18'de 5 (27.8%)</span>
        <span>13 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Günlükleme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (0%) / 5'te 0 (0%)</span>
        <span>5 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Oturum Tanılaması</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (0%) / 4'te 0 (0%)</span>
        <span>4 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Telemetri Dışa Aktarımı</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>13'te 1 (7.7%) / 21'de 7 (33.3%)</span>
        <span>14 yetkinlik boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsama kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Girdi ve Komutlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>8'de 0 (0%) / 8'de 0 (0%)</span>
        <span>8 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Kabuk Yürütme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (0%) / 4'te 0 (0%)</span>
        <span>4 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İşleme ve Çıktı Güvenliği</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (0%) / 4'te 0 (0%)</span>
        <span>4 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Çalışma Zamanı Modları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>14'te 0 (0%) / 14'te 0 (0%)</span>
        <span>14 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Oturum Yönetimi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>3'te 0 (0%) / 3'te 0 (0%)</span>
        <span>3 yetkinlik boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ses ve gerçek zamanlı konuşma - 6 alan">
    <p className="maturity-readiness-summary">6 inceleme gerekli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsama kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Uygulama Konuşması</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (0%) / 4'te 0 (0%)</span>
        <span>4 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerçek Zamanlı Konuşma Oturumları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>11'de 0 (0%) / 11'de 0 (0%)</span>
        <span>11 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma ve Transkripsiyon</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (0%) / 5'te 0 (0%)</span>
        <span>5 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Gözlemlenebilirliği</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>5'te 0 (0%) / 5'te 0 (0%)</span>
        <span>5 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Sağlayıcıları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>7'de 0 (0%) / 7'de 0 (0%)</span>
        <span>7 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sesle Uyandırma ve Yönlendirme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>4'te 0 (0%) / 4'te 0 (0%)</span>
        <span>4 yetkinlik boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sesli Arama kanalı - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekli</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsama kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'de 0 (0%) / 1'de 0 (0%)</span>
        <span>1 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve İşlemler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'de 0 (0%) / 2'de 0 (0%)</span>
        <span>2 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve Teslim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>1'de 0 (0%) / 1'de 0 (0%)</span>
        <span>1 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'de 0 (0%) / 2'de 0 (0%)</span>
        <span>2 yetkinlik boşluğu</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerçek Zamanlı Ses ve Aramalar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekli - Tam taksonomi doğrulaması</span>
        </div>
        <span>2'de 0 (0%) / 2'de 0 (0%)</span>
        <span>2 yetkinlik boşluğu</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS yardımcı yüzeyleri - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">İletim ve Kurtarma</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dağıtım ve Destek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yürütme Onayları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bildirimler ve Yanıtlar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Watch Uygulaması Kullanıcı Arayüzü</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>3 üzerinden 0 (%0) / 3 üzerinden 0 (%0)</span>
        <span>3 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Web arama araçları - 4 alan">
    <p className="maturity-readiness-summary">2 inceleme gerekiyor / 2 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ağ Güvenliği</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Arama Sağlayıcıları</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>19 üzerinden 2 (%10,5) / 19 üzerinden 2 (%10,5)</span>
        <span>17 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kurulum ve Tanılama</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>9 üzerinden 0 (%0) / 9 üzerinden 0 (%0)</span>
        <span>9 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Araç Kullanılabilirliği ve Getirme</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 2 (%18,2) / 12 üzerinden 3 (%25)</span>
        <span>9 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Erişim ve Kimlik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>7 üzerinden 0 (%0) / 7 üzerinden 0 (%0)</span>
        <span>7 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal Kurulumu ve Operasyonları</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>5 üzerinden 0 (%0) / 5 üzerinden 0 (%0)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konuşma Yönlendirme ve İletim</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>4 üzerinden 0 (%0) / 4 üzerinden 0 (%0)</span>
        <span>4 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medya ve Zengin İçerik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2 üzerinden 0 (%0) / 2 üzerinden 0 (%0)</span>
        <span>2 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Yerel Denetimler ve Onaylar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>2 üzerinden 0 (%0) / 2 üzerinden 0 (%0)</span>
        <span>2 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WSL2 üzerinden Windows - 6 alan">
    <p className="maturity-readiness-summary">5 inceleme gerekiyor / 1 kısmen incelendi</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Alan</span><span>Özellikler / kapsam kimlikleri</span><span>Takip</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tarayıcı ve Kontrol Kullanıcı Arayüzü</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>8 üzerinden 0 (%0) / 8 üzerinden 0 (%0)</span>
        <span>8 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tanılama ve Onarım</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Kısmen incelendi - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 1 (%16,7) / 8 üzerinden 3 (%37,5)</span>
        <span>5 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Erişimi ve Dışa Açılımı</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>11 üzerinden 0 (%0) / 11 üzerinden 0 (%0)</span>
        <span>11 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway Hizmeti Yaşam Döngüsü</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>10 üzerinden 0 (%0) / 10 üzerinden 0 (%0)</span>
        <span>10 yetenek açığı</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL Kurulumu</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">İnceleme gerekiyor - Tam taksonomi doğrulaması</span>
        </div>
        <span>6 üzerinden 0 (%0) / 6 üzerinden 0 (%0)</span>
        <span>6 yetenek açığı</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Son güncelleme: 2026-06-22
