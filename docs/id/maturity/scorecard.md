---
summary: Skor kesiapan rilis OpenClaw untuk area produk, integrasi, dan alur kerja yang didukung.
title: Kartu skor kematangan
x-i18n:
    generated_at: "2026-06-27T17:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 916f070ca42778dc1cc41e47cdb4ace502f073c4e888f21526b762226a856d40
    source_path: maturity/scorecard.md
    workflow: 16
---

# Kartu skor kematangan

<div className="maturity-hero">
  <p className="maturity-kicker">kesiapan rilis - dibuat dari taksonomi + bukti QA</p>
  <p className="maturity-hero-title">Tampilan praktis tentang apa yang siap, apa yang terbukti, dan apa yang masih perlu dikerjakan.</p>
  <p>50 permukaan - 281 area kapabilitas - cakupan deterministik ditambah kualitas dan kelengkapan yang ditinjau manusia.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Telusuri permukaan</a> / <a href="#qa-evidence-summary">Periksa bukti QA</a> / <a href="/id/maturity/taxonomy">Baca taksonomi</a></p>
</div>

## Tujuan halaman ini

Gunakan halaman ini untuk menjawab satu pertanyaan: permukaan OpenClaw mana yang merupakan pilihan kredibel untuk rilis, dan bukti apa yang mendukung penilaian tersebut? Cakupan berasal dari bukti QA deterministik; kualitas dan kelengkapan dipelihara sebagai skor kematangan yang telah ditinjau.

## Sekilas

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">67%</span>
      <span>Skor kematangan</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "67" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alfa</span>
      <span>Kualitas + kelengkapan</span>
      <span>Cakupan Eksperimental - 4%</span>
      <span>Kualitas Alfa - 63%</span>
      <span>Kelengkapan Beta - 70%</span>
    </div>
  </div>
</div>

Cakupan sengaja dipandu oleh bukti: sebuah area tidak menjadi "siap" hanya karena implementasinya ada. Ini bukan masukan untuk skor kematangan, tetapi OpenClaw bertujuan mempertahankan cakupan end-to-end di atas 90% untuk fitur matang tingkat Stabil atau lebih baik seiring waktu.

## Rentang skor

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alfa</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stabil</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Penjelajah permukaan

<a id="surface-explorer" />

Permukaan diurutkan berdasarkan tingkat kematangan, kelengkapan, dan kualitas. Dukungan LTS ditampilkan bersama setiap baris agar opsi yang siap rilis mudah dibandingkan.

  <Tabs>
  <Tab title="Semua permukaan">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Permukaan</span><span>Cakupan</span><span>Kualitas</span><span>Kelengkapan</span><span>Dukungan</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Runtime Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>13 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Host Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Host Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Runtime Agen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Mesin sesi, memori, dan konteks</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Kerangka kerja saluran</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Alat otomatisasi browser, exec, dan sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilitas</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Jalur penyedia OpenAI dan Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplikasi Web Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Alat pencarian web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Keamanan, autentikasi, penyandingan, dan rahasia</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automasi: Cron, hook, tugas, polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hosting Docker dan Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows melalui WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi dan perangkat Linux kecil</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Jalur penyedia Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Penuh - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Penuh - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Jalur penyedia Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage dan BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Aplikasi pendamping macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Jalur penyedia OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Pemahaman media dan pembuatan media</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Alat pembuatan gambar, video, dan musik</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Penyedia model lokal: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Penyedia terhosting berekor panjang</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Suara dan percakapan waktu nyata</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#android-app"><span className="maturity-surface-title">Aplikasi Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>7 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows Native</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hosting Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, kanal regional</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#ios-app"><span className="maturity-surface-title">aplikasi iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>8 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">jalur instalasi Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">saluran Panggilan Suara</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">permukaan pendamping watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">aplikasi pendamping Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Direncanakan</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">aplikasi pendamping Windows native</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Direncanakan</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Inti">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Permukaan</span><span>Cakupan</span><span>Kualitas</span><span>Kelengkapan</span><span>Dukungan</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Runtime Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>13 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Runtime Agen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Mesin sesi, memori, dan konteks</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Kerangka kerja saluran</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#observability"><span className="maturity-surface-title">Observabilitas</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Aplikasi Web Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Keamanan, autentikasi, pemasangan, dan rahasia</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automasi: Cron, hook, tugas, polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Pemahaman media dan pembuatan media</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Suara dan percakapan waktu nyata</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK Aplikasi OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Platform">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Permukaan</span><span>Cakupan</span><span>Kualitas</span><span>Kelengkapan</span><span>Dukungan</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">host Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">host Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">hosting Docker dan Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows melalui WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi dan perangkat Linux kecil</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">aplikasi pendamping macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#android-app"><span className="maturity-surface-title">aplikasi Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>7 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows natif</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">hosting Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#ios-app"><span className="maturity-surface-title">aplikasi iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>8 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Jalur instalasi Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Surface pendamping watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Aplikasi pendamping Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Direncanakan</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Aplikasi pendamping Windows native</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Direncanakan</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kanal">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Surface</span><span>Cakupan</span><span>Kualitas</span><span>Kelengkapan</span><span>Dukungan</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Penuh - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Penuh - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage dan BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, saluran regional</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Saluran Panggilan Suara</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Eksperimental</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Penyedia dan alat">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Permukaan</span><span>Cakupan</span><span>Kualitas</span><span>Kelengkapan</span><span>Dukungan</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Otomasi browser, exec, dan alat sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Sebagian - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Jalur penyedia OpenAI dan Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parsial - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Alat pencarian web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Jalur penyedia Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Jalur penyedia Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Jalur penyedia OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Alat pembuatan gambar, video, dan musik</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Penyedia model lokal: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/id/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Penyedia hosted long-tail</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 area</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Cakupan</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Eksperimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kualitas</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kelengkapan</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Tidak ada</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Ringkasan bukti QA

Pemeriksaan di bawah ini menunjukkan area kartu skor mana yang dijalankan oleh bukti profil QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Validasi taksonomi penuh</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 pemeriksaan - 94 lulus, 2 diblokir</span>
    <span>0 dari 281 (0%) area - 20 dari 1675 (1.2%) fitur - 77 dari 1665 (4.6%) ID cakupan</span>
  </div>
</div>

### Kesiapan berdasarkan area

Buka sebuah permukaan untuk memeriksa status bukti setiap kategori. Daftar tetap diciutkan agar halaman tetap berguna secara sekilas.

<AccordionGroup>
  <Accordion title="Runtime Agen - 9 area">
    <p className="maturity-readiness-summary">8 ditinjau sebagian / 1 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eksekusi Giliran Agen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 7 dari 24 (29.2%)</span>
        <span>17 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Eksternal dan Subagen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 3 dari 10 (30%)</span>
        <span>7 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eksekusi Penyedia Terhosting</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 5 (20%) / 1 dari 5 (20%)</span>
        <span>4 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyedia Lokal dan Dihosting Sendiri</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pemilihan Model dan Runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 2 dari 8 (25%)</span>
        <span>6 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autentikasi Penyedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 4 dari 17 (23.5%)</span>
        <span>13 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Streaming dan Kemajuan</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 5 dari 9 (55.6%)</span>
        <span>4 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Panggilan Alat dan Penanganan Respons</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 15 dari 23 (65.2%)</span>
        <span>8 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Eksekusi Alat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 6 dari 12 (50%)</span>
        <span>6 celah kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikasi Android - 7 area">
    <p className="maturity-readiness-summary">7 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan Koneksi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Perangkat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribusi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pengambilan Media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Obrolan Seluler</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pengaturan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Suara</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 celah kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Jalur penyedia Anthropic - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Input Media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pemilihan Model dan Runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 12 (0%)</span>
        <span>12 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cache Prompt dan Konteks</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autentikasi dan Pemulihan Penyedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 celah kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transport Permintaan dan Semantik Giliran</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 celah kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automasi: Cron, hook, tugas, polling - 6 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau / 1 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hook Automasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tugas dan Alur Latar Belakang</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron Job</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 15 (0%) / 0 dari 15 (0%)</span>
        <span>15 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ingress Peristiwa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 15 (0%) / 0 dari 15 (0%)</span>
        <span>15 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 1 dari 7 (14.3%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Polling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automasi browser, exec, dan alat sandbox - 3 area">
    <p className="maturity-readiness-summary">2 ditinjau sebagian / 1 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automasi Browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 8 (12.5%) / 1 dari 8 (12.5%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kebijakan Sandbox dan Alat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pemanggilan dan Eksekusi Alat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>2 dari 6 (33.3%) / 4 dari 8 (50%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikasi Web Gateway - 6 area">
    <p className="maturity-readiness-summary">3 perlu ditinjau / 3 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Kepercayaan Browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Percakapan Realtime Browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI Browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 1 dari 12 (8.3%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfigurasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konsol Operator</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 1 dari 12 (8.3%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Percakapan WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 15 (0%) / 2 dari 20 (10%)</span>
        <span>18 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kerangka kerja channel - 8 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau / 4 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perintah Tindakan dan Persetujuan Channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan Channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 1 dari 7 (14.3%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 5 dari 27 (18.5%)</span>
        <span>22 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perilaku Thread Grup dan Ruang Ambien</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 4 dari 11 (36.4%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses Masuk dan Gerbang Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lampiran Media dan Data Channel Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pengiriman Keluar dan Alur Balasan</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 8 dari 21 (38.1%)</span>
        <span>13 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kesehatan Status dan Kontrol Operator</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penemuan Katalog</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilitas dan Kepercayaan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 12 (0%) / 0 dari 12 (0%)</span>
        <span>12 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Siklus Hidup dan Kesehatan Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 26 (0%) / 0 dari 26 (0%)</span>
        <span>26 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penerbitan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau / 2 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilitas CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 6 (16.7%) / 1 dari 6 (16.7%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Manajemen Layanan Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 1 dari 7 (14.3%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Onboarding dan Penyiapan Autentikasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan Plugin dan Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembaruan dan Peningkatan Versi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 area">
    <p className="maturity-readiness-summary">6 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 12 (0%) / 0 dari 12 (0%)</span>
        <span>12 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol dan Persetujuan Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Suara dan Panggilan Realtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hosting Docker dan Podman - 4 area">
    <p className="maturity-readiness-summary">3 perlu ditinjau / 1 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox dan Tooling Agen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operasi Kontainer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan Kontainer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rilis dan Validasi Image</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 5 (20%) / 2 dari 7 (28.6%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, kanal regional - 4 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Runtime Gateway - 13 area">
    <p className="maturity-readiness-summary">9 perlu ditinjau / 4 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persetujuan dan Eksekusi Jarak Jauh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autentikasi dan Penyandingan Perangkat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Siklus Hidup Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 4 dari 12 (33.3%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API dan Peristiwa RPC Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 20 (0%) / 2 dari 22 (9.1%)</span>
        <span>20 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kesehatan, Diagnostik, dan Perbaikan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Permukaan Web yang Dihosting</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>1 dari 4 (25%) / 1 dari 4 (25%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Penemuan Jaringan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Node dan Kapabilitas Jarak Jauh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilitas Protokol</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Peran dan Izin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Keamanan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Koneksi WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>1 dari 8 (12.5%) / 1 dari 8 (12.5%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 16 (0%) / 0 dari 16 (0%)</span>
        <span>16 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol dan Persetujuan Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 16 (0%) / 0 dari 16 (0%)</span>
        <span>16 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Jalur penyedia Google - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Gemini Langsung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media, Pencarian, dan Realtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean Model dan Endpoint</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyimpanan Cache Prompt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan Penyedia dan Kredensial</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Alat pembuatan gambar, video, dan musik - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembuatan Gambar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Penemuan Media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembuatan Musik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Siklus Hidup Tugas dan Pengiriman</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 12 (0%) / 0 dari 12 (0%)</span>
        <span>12 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembuatan Video</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage dan BlueBubbles - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Native dan Persetujuan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikasi iOS - 8 area">
    <p className="maturity-readiness-summary">8 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanvas dan Layar</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat dan Sesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perintah Perangkat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribusi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Diagnostik Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Berbagi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notifikasi dan Latar Belakang</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Suara</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hosting Kubernetes - 4 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Eksposur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Siklus Hidup Klaster</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfigurasi dan Rahasia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan Deployment</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikasi pendamping Linux - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribusi Aplikasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat dan Sesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kapabilitas Desktop</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konektivitas Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status dan Diagnostik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Host Gateway Linux - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Target Deployment</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostik dan Perbaikan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Gateway dan Kontrol Layanan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Pembaruan Host</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses Jarak Jauh dan Keamanan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Penyedia model lokal: Ollama, vLLM, SGLang, LM Studio - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memori Lokal dan Embedding</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Penyedia Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Keamanan Jaringan dan Kontrol Prompt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilitas Runtime yang Kompatibel dengan OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan, Siklus Hidup, dan Diagnostik Penyedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 12 (0%) / 0 dari 12 (0%)</span>
        <span>12 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Penyedia hosted long-tail - 3 area">
    <p className="maturity-readiness-summary">3 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyedia LLM Hosted</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 12 (0%) / 0 dari 12 (0%)</span>
        <span>12 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyedia Media Hosted</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operasi Penyedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 12 (0%) / 0 dari 12 (0%)</span>
        <span>12 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="aplikasi pendamping macOS - 8 area">
    <p className="maturity-readiness-summary">8 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan Lokal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kemampuan Bawaan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Koneksi Jarak Jauh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat Jarak Jauh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status dan Pengaturan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Suara dan Bicara</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="host Gateway macOS - 7 area">
    <p className="maturity-readiness-summary">7 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostik dan Observabilitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Siklus Hidup Layanan Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integrasi Gateway Lokal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Izin dan Kemampuan Bawaan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Profil dan Isolasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mode Gateway Jarak Jauh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 area">
    <p className="maturity-readiness-summary">6 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Saluran</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Enkripsi dan Verifikasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Bawaan dan Persetujuan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Pemahaman media dan pembuatan media - 6 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau / 2 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penanganan Media Channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfigurasi Media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembuatan Media</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>1 dari 17 (5.9%) / 1 dari 19 (5.3%)</span>
        <span>18 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penerimaan dan Akses Media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pemahaman Media</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 12 (0%) / 1 dari 14 (7.1%)</span>
        <span>13 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pengiriman Teks-ke-Ucapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Native dan Persetujuan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows Native - 4 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Manajemen Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Jaringan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembaruan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Aplikasi pendamping Windows native - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sesi Obrolan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Alat Desktop dan Izin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Koneksi Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instalasi dan Pembaruan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status dan Perbaikan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Jalur instalasi Nix - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktivasi dan UX Aplikasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfigurasi dan Status</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Serah Terima Instalasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Siklus Hidup Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Layanan dan Pelindung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Jalur penyedia OpenAI dan Codex - 5 area">
    <p className="maturity-readiness-summary">2 perlu ditinjau / 3 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Input Gambar dan Multimodal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model dan Autentikasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 6 (16.7%) / 4 dari 9 (44.4%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Harness Codex Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 4 dari 9 (44.4%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilitas Respons dan Alat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 4 (25%) / 2 dari 5 (40%)</span>
        <span>3 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Suara dan Audio Realtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="SDK Aplikasi OpenClaw - 6 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau / 1 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Percakapan Agen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API Klien</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Peristiwa dan Persetujuan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembantu Sumber Daya</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 1 dari 6 (16.7%)</span>
        <span>5 kesenjangan kemampuan</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Jalur provider OpenRouter - 4 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Chat dan Normalisasi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 15 (0%) / 0 dari 15 (0%)</span>
        <span>15 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pembuatan Media dan Ucapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pemulihan dan Diagnostik Provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Auth Provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 14 (0%) / 0 dari 14 (0%)</span>
        <span>14 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9 area">
    <p className="maturity-readiness-summary">6 perlu ditinjau / 3 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penulisan dan Pengemasan plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins bawaan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Menginstal dan menjalankan plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 7 dari 20 (35%)</span>
        <span>13 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persetujuan Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins provider dan alat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 6 (16.7%) / 9 dari 21 (42.9%)</span>
        <span>12 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mempublikasikan plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Menguji plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 3 dari 11 (27.3%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi dan perangkat Linux kecil - 4 area">
    <p className="maturity-readiness-summary">4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Performa dan Diagnostik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses Jarak Jauh dan Auth</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Kompatibilitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 12 (0%) / 0 dari 12 (0%)</span>
        <span>12 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Keamanan, auth, pemasangan, dan rahasia - 6 area">
    <p className="maturity-readiness-summary">2 ditinjau sebagian / 4 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kebijakan Persetujuan dan Perlindungan Alat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 3 dari 6 (50%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Akses Channel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Higiene Kredensial dan Rahasia</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 5 dari 11 (45.5%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pemasangan Perangkat dan Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Auth Gateway dan Akses Jarak Jauh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kepercayaan Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sesi, memori, dan mesin konteks - 9 area">
    <p className="maturity-readiness-summary">2 perlu ditinjau / 7 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Manajemen Sesi dan Transkrip CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mesin Konteks</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 4 dari 7 (57.1%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prompt Inti dan Konteks</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 3 dari 8 (37.5%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Riwayat Lintas Klien dan Kesetaraan Sesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 2 dari 5 (40%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostik, Pemeliharaan, dan Pemulihan</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 4 dari 10 (40%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memori</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 6 dari 13 (46.2%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean Sesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 1 dari 4 (25%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Manajemen Token</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 2 dari 10 (20%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persistensi Transkrip</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol dan Persetujuan Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol dan Persetujuan Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol dan Persetujuan Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Observabilitas - 5 area">
    <p className="maturity-readiness-summary">3 ditinjau sebagian / 2 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pengumpulan Diagnostik</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>1 dari 8 (12.5%) / 3 dari 10 (30%)</span>
        <span>7 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kesehatan dan Perbaikan</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>1 dari 12 (8.3%) / 5 dari 18 (27.8%)</span>
        <span>13 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pencatatan log</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostik Sesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ekspor Telemetri</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi lengkap</span>
        </div>
        <span>1 dari 13 (7.7%) / 7 dari 21 (33.3%)</span>
        <span>14 celah kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Input dan Perintah</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eksekusi Shell Lokal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Keamanan Rendering dan Output</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mode Runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 14 (0%) / 0 dari 14 (0%)</span>
        <span>14 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Manajemen Sesi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 celah kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Suara dan percakapan waktu nyata - 6 area">
    <p className="maturity-readiness-summary">6 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Percakapan Aplikasi Native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sesi Percakapan Waktu Nyata</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ucapan dan Transkripsi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observabilitas Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyedia Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bangun Suara dan Routing</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 celah kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Saluran Panggilan Suara - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Saluran</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routing dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 1 (0%) / 0 dari 1 (0%)</span>
        <span>1 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 celah kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Suara dan Panggilan Waktu Nyata</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi lengkap</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 celah kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="permukaan pendamping watchOS - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pengiriman dan Pemulihan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribusi dan Dukungan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persetujuan Eksekusi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notifikasi dan Balasan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI Aplikasi Watch</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 3 (0%) / 0 dari 3 (0%)</span>
        <span>3 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Alat pencarian web - 4 area">
    <p className="maturity-readiness-summary">2 perlu ditinjau / 2 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Keamanan Jaringan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyedia Pencarian</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>2 dari 19 (10.5%) / 2 dari 19 (10.5%)</span>
        <span>17 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Diagnostik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 9 (0%) / 0 dari 9 (0%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ketersediaan Alat dan Pengambilan</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>2 dari 11 (18.2%) / 3 dari 12 (25%)</span>
        <span>9 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Identitas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 7 (0%) / 0 dari 7 (0%)</span>
        <span>7 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan dan Operasi Kanal</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 5 (0%) / 0 dari 5 (0%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Perutean dan Pengiriman Percakapan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 4 (0%) / 0 dari 4 (0%)</span>
        <span>4 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media dan Konten Kaya</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontrol Native dan Persetujuan</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 2 (0%) / 0 dari 2 (0%)</span>
        <span>2 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows melalui WSL2 - 6 area">
    <p className="maturity-readiness-summary">5 perlu ditinjau / 1 ditinjau sebagian</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Fitur / ID cakupan</span><span>Tindak lanjut</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browser dan UI Kontrol</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 8 (0%) / 0 dari 8 (0%)</span>
        <span>8 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostik dan Perbaikan</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Ditinjau sebagian - Validasi taksonomi penuh</span>
        </div>
        <span>1 dari 6 (16.7%) / 3 dari 8 (37.5%)</span>
        <span>5 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Akses dan Eksposur Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 11 (0%) / 0 dari 11 (0%)</span>
        <span>11 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Siklus Hidup Layanan Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 10 (0%) / 0 dari 10 (0%)</span>
        <span>10 kesenjangan kapabilitas</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Penyiapan WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Perlu ditinjau - Validasi taksonomi penuh</span>
        </div>
        <span>0 dari 6 (0%) / 0 dari 6 (0%)</span>
        <span>6 kesenjangan kapabilitas</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Terakhir diperbarui: 2026-06-22
