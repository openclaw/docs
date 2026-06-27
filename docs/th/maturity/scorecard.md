---
summary: คะแนนความพร้อมสำหรับการเผยแพร่ของ OpenClaw สำหรับส่วนผลิตภัณฑ์ การผสานรวม และเวิร์กโฟลว์ที่รองรับ
title: ดัชนีชี้วัดความพร้อมใช้งาน
x-i18n:
    generated_at: "2026-06-27T17:45:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 916f070ca42778dc1cc41e47cdb4ace502f073c4e888f21526b762226a856d40
    source_path: maturity/scorecard.md
    workflow: 16
---

# ตารางคะแนนความพร้อม

<div className="maturity-hero">
  <p className="maturity-kicker">ความพร้อมสำหรับการเผยแพร่ - สร้างจากอนุกรมวิธาน + หลักฐาน QA</p>
  <p className="maturity-hero-title">มุมมองเชิงปฏิบัติของสิ่งที่พร้อมแล้ว สิ่งที่พิสูจน์แล้ว และสิ่งที่ยังต้องปรับปรุง</p>
  <p>50 ส่วนติดต่อ - 281 พื้นที่ความสามารถ - ความครอบคลุมแบบกำหนดแน่นอนพร้อมคุณภาพและความสมบูรณ์ที่ผ่านการตรวจทานโดยมนุษย์</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">เรียกดูส่วนติดต่อ</a> / <a href="#qa-evidence-summary">ตรวจสอบหลักฐาน QA</a> / <a href="/th/maturity/taxonomy">อ่านอนุกรมวิธาน</a></p>
</div>

## หน้านี้มีไว้เพื่ออะไร

ใช้หน้านี้เพื่อตอบคำถามเดียว: ส่วนติดต่อใดของ OpenClaw เป็นตัวเลือกที่น่าเชื่อถือสำหรับการเผยแพร่ และมีหลักฐานใดรองรับการตัดสินนั้น? ความครอบคลุมมาจากหลักฐาน QA แบบกำหนดแน่นอน ส่วนคุณภาพและความสมบูรณ์ได้รับการดูแลเป็นคะแนนความพร้อมที่ผ่านการตรวจทานแล้ว

## ภาพรวมอย่างรวดเร็ว

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">67%</span>
      <span>คะแนนความพร้อม</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "67" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">อัลฟา</span>
      <span>คุณภาพ + ความสมบูรณ์</span>
      <span>ความครอบคลุม ทดลอง - 4%</span>
      <span>คุณภาพ อัลฟา - 63%</span>
      <span>ความสมบูรณ์ เบต้า - 70%</span>
    </div>
  </div>
</div>

ความครอบคลุมตั้งใจให้นำโดยหลักฐาน: พื้นที่หนึ่งจะไม่กลายเป็น "พร้อม" เพียงเพราะมีการใช้งานจริงอยู่แล้ว สิ่งนี้ไม่ใช่อินพุตของคะแนนความพร้อม แต่ OpenClaw ตั้งเป้าจะรักษาความครอบคลุมแบบต้นทางถึงปลายทางให้สูงกว่า 90% สำหรับฟีเจอร์ที่เติบโตเต็มที่ระดับเสถียรหรือดีกว่าเมื่อเวลาผ่านไป

## ช่วงคะแนน

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">เบต้า</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">เสถียร</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## ตัวสำรวจส่วนติดต่อ

<a id="surface-explorer" />

ส่วนติดต่อถูกเรียงตามระดับความพร้อม ความสมบูรณ์ และคุณภาพ การรองรับ LTS จะแสดงควบคู่กับแต่ละแถว เพื่อให้เปรียบเทียบตัวเลือกที่พร้อมสำหรับการเผยแพร่ได้ง่าย

  <Tabs>
  <Tab title="พื้นผิวทั้งหมด">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>พื้นผิว</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การสนับสนุน</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">รันไทม์ Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>13 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">โฮสต์ Linux Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">โฮสต์ macOS Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">รันไทม์ Agent</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">เซสชัน หน่วยความจำ และเอนจินบริบท</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">เฟรมเวิร์กช่องทาง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">เครื่องมืออัตโนมัติเบราว์เซอร์, exec และแซนด์บ็อกซ์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#observability"><span className="maturity-surface-title">ความสามารถในการสังเกตการณ์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenAI และ Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">เว็บแอป Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">เครื่องมือค้นหาเว็บ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">ความปลอดภัย การยืนยันตัวตน การจับคู่ และความลับ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">ระบบอัตโนมัติ: Cron, ฮุก, งาน, การโพล</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">การโฮสต์ Docker และ Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows ผ่าน WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็ม - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็ม - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage และ BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">แอปคู่หู macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">การทำความเข้าใจสื่อและการสร้างสื่อ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">เครื่องมือสร้างรูปภาพ วิดีโอ และเพลง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ผู้ให้บริการโมเดลภายในเครื่อง: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ผู้ให้บริการแบบโฮสต์กลุ่มหางยาว</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">เสียงและการสนทนาแบบเรียลไทม์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#android-app"><span className="maturity-surface-title">แอป Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows แบบเนทีฟ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">การโฮสต์ Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, ช่องทางระดับภูมิภาค</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#ios-app"><span className="maturity-surface-title">แอป iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">เส้นทางการติดตั้ง Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">ช่องทางการโทรด้วยเสียง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">พื้นผิวคู่กันของ watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">แอปคู่กันสำหรับ Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนแล้ว</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">แอปคู่กันแบบเนทีฟสำหรับ Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนแล้ว</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="แกนหลัก">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>พื้นผิว</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การรองรับ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">รันไทม์ Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>13 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">รันไทม์เอเจนต์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">เซสชัน หน่วยความจำ และเอนจินบริบท</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">เฟรมเวิร์กช่องทาง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#observability"><span className="maturity-surface-title">ความสามารถในการสังเกตการณ์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">เว็บแอป Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">ความปลอดภัย, การยืนยันตัวตน, การจับคู่ และความลับ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">ระบบอัตโนมัติ: Cron, hooks, งาน, การโพล</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">การทำความเข้าใจสื่อและการสร้างสื่อ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">เสียงและการสนทนาแบบเรียลไทม์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">เชิงทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="แพลตฟอร์ม">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>พื้นผิว</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การสนับสนุน</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">โฮสต์ Linux Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">โฮสต์ macOS Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">การโฮสต์ Docker และ Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows ผ่าน WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">แอปคู่หู macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#android-app"><span className="maturity-surface-title">แอป Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟ่า</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows แบบเนทีฟ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟ่า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">การโฮสต์ Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟ่า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#ios-app"><span className="maturity-surface-title">แอป iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">เส้นทางการติดตั้ง Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">พื้นผิวคู่หูของ watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">แอปคู่หูสำหรับ Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">แอปคู่หู Windows แบบเนทีฟ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="ช่องทาง">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>พื้นผิว</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การรองรับ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็ม - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็ม - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage และ BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, ช่องทางภูมิภาค</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">ช่องทางการโทรด้วยเสียง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="ผู้ให้บริการและเครื่องมือ">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>พื้นผิว</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความครบถ้วน</span><span>การรองรับ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">เครื่องมืออัตโนมัติของเบราว์เซอร์, exec และ sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenAI และ Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">เครื่องมือค้นหาเว็บ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบต้า</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">เครื่องมือสร้างภาพ วิดีโอ และเพลง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟ่า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ผู้ให้บริการโมเดลในเครื่อง: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟ่า</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครบถ้วน</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ผู้ให้บริการแบบโฮสต์กลุ่ม Long-tail</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟ่า</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟ่า</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## สรุปหลักฐาน QA

การตรวจสอบด้านล่างแสดงว่าพื้นที่ใดใน scorecard ได้รับการทดสอบโดยหลักฐานจากโปรไฟล์ QA

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">การตรวจสอบ taxonomy แบบเต็ม</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>ตรวจสอบ 96 รายการ - ผ่าน 94 รายการ, ถูกบล็อก 2 รายการ</span>
    <span>0 จาก 281 (0%) พื้นที่ - 20 จาก 1675 (1.2%) ฟีเจอร์ - 77 จาก 1665 (4.6%) ID ความครอบคลุม</span>
  </div>
</div>

### ความพร้อมตามพื้นที่

เปิดพื้นผิวหนึ่งรายการเพื่อตรวจสอบสถานะหลักฐานของแต่ละหมวดหมู่ รายการจะยังคงยุบไว้เพื่อให้หน้าเว็บยังดูภาพรวมได้อย่างรวดเร็ว

<AccordionGroup>
  <Accordion title="รันไทม์เอเจนต์ - 9 พื้นที่">
    <p className="maturity-readiness-summary">ตรวจทานบางส่วนแล้ว 8 / ต้องตรวจทาน 1</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>งานติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินการรอบของเอเจนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 7 จาก 24 (29.2%)</span>
        <span>ช่องว่างของความสามารถ 17 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ภายนอกและเอเจนต์ย่อย</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 3 จาก 10 (30%)</span>
        <span>ช่องว่างของความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินการของผู้ให้บริการแบบโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>1 จาก 5 (20%) / 1 จาก 5 (20%)</span>
        <span>ช่องว่างของความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการภายในเครื่องและโฮสต์เอง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างของความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเลือกโมเดลและรันไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 2 จาก 8 (25%)</span>
        <span>ช่องว่างของความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตรวจสอบสิทธิ์ของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 4 จาก 17 (23.5%)</span>
        <span>ช่องว่างของความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสตรีมและความคืบหน้า</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 5 จาก 9 (55.6%)</span>
        <span>ช่องว่างของความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเรียกใช้เครื่องมือและการจัดการการตอบกลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 15 จาก 23 (65.2%)</span>
        <span>ช่องว่างของความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมการดำเนินการของเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 6 จาก 12 (50%)</span>
        <span>ช่องว่างของความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอป Android - 7 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 7</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>งานติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าการเชื่อมต่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างของความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ของอุปกรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างของความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างของความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจับสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างของความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แชตบนมือถือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างของความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างของความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างของความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ Anthropic - 5 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>งานติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">อินพุตสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างของความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเลือกโมเดลและรันไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างของความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แคชพรอมป์และบริบท</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างของความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตรวจสอบสิทธิ์และการกู้คืนของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างของความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การขนส่งคำขอและความหมายของรอบ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างของความสามารถ 10 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ระบบอัตโนมัติ: cron, hooks, tasks, polling - 6 ด้าน">
    <p className="maturity-readiness-summary">5 ต้องตรวจทาน / 1 ตรวจทานแล้วบางส่วน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automation Hooks</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>11 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">งานและโฟลว์เบื้องหลัง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>10 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">งาน Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 15 (0%) / 0 จาก 15 (0%)</span>
        <span>15 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การรับเหตุการณ์ขาเข้า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 15 (0%) / 0 จาก 15 (0%)</span>
        <span>15 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 7 (14.3%)</span>
        <span>6 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมการ Polling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>10 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ระบบอัตโนมัติของเบราว์เซอร์, exec และเครื่องมือ sandbox - 3 ด้าน">
    <p className="maturity-readiness-summary">2 ตรวจทานแล้วบางส่วน / 1 ต้องตรวจทาน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ระบบอัตโนมัติของเบราว์เซอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>1 จาก 8 (12.5%) / 1 จาก 8 (12.5%)</span>
        <span>7 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox และนโยบายเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>6 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเรียกใช้และการดำเนินการเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>2 จาก 6 (33.3%) / 4 จาก 8 (50%)</span>
        <span>4 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เว็บแอป Gateway - 6 ด้าน">
    <p className="maturity-readiness-summary">3 ต้องตรวจทาน / 3 ตรวจทานแล้วบางส่วน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงเบราว์เซอร์และความน่าเชื่อถือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสนทนาเรียลไทม์ในเบราว์เซอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI ของเบราว์เซอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 1 จาก 12 (8.3%)</span>
        <span>11 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">คอนโซลผู้ปฏิบัติงาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 1 จาก 12 (8.3%)</span>
        <span>11 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสนทนา WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 15 (0%) / 2 จาก 20 (10%)</span>
        <span>18 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เฟรมเวิร์กช่องทาง - 8 ด้าน">
    <p className="maturity-readiness-summary">4 ต้องตรวจทาน / 4 ตรวจทานแล้วบางส่วน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">คำสั่งการดำเนินการของช่องทางและการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 7 (14.3%)</span>
        <span>6 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 5 จาก 27 (18.5%)</span>
        <span>22 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">พฤติกรรมเธรดกลุ่มและห้องแวดล้อม</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 4 จาก 11 (36.4%)</span>
        <span>7 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงขาเข้าและด่านตรวจสอบตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ไฟล์แนบสื่อและข้อมูลช่องทางแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>4 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ไปป์ไลน์การส่งมอบขาออกและการตอบกลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 8 จาก 21 (38.1%)</span>
        <span>13 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะ ความสมบูรณ์ และการควบคุมของผู้ปฏิบัติงาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 6 (0%)</span>
        <span>6 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 ด้าน">
    <p className="maturity-readiness-summary">4 ต้องตรวจสอบ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การค้นพบแคตตาล็อก</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้และความน่าเชื่อถือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตและสุขภาพของ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 26 (0%) / 0 จาก 26 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 26 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 ด้าน">
    <p className="maturity-readiness-summary">5 ต้องตรวจสอบ / 2 ตรวจสอบแล้วบางส่วน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสังเกตการณ์ CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>1 จาก 6 (16.7%) / 1 จาก 6 (16.7%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ตัวตรวจสุขภาพ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการบริการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 7 (14.3%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเริ่มต้นใช้งานและการตั้งค่าการตรวจสอบสิทธิ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า Plugin และช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอัปเดตและการอัปเกรด</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 ด้าน">
    <p className="maturity-readiness-summary">6 ต้องตรวจสอบ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงและการโทรแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="การโฮสต์ Docker และ Podman - 4 ด้าน">
    <p className="maturity-readiness-summary">3 ต้องตรวจสอบ / 1 ตรวจสอบแล้วบางส่วน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แซนด์บ็อกซ์และเครื่องมือสำหรับเอเจนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินงานคอนเทนเนอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าคอนเทนเนอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่อิมเมจและการตรวจสอบความถูกต้อง</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>1 จาก 5 (20%) / 2 จาก 7 (28.6%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, ช่องทางภูมิภาค - 4 ด้าน">
    <p className="maturity-readiness-summary">4 ต้องตรวจทาน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการปฏิบัติงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="รันไทม์ Gateway - 13 ด้าน">
    <p className="maturity-readiness-summary">9 ต้องตรวจทาน / 4 ตรวจทานบางส่วนแล้ว</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอนุมัติและการดำเนินการระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การยืนยันตัวตนอุปกรณ์และการจับคู่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตของ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 4 จาก 12 (33.3%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API RPC และเหตุการณ์ของ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 20 (0%) / 2 จาก 22 (9.1%)</span>
        <span>ช่องว่างด้านความสามารถ 20 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานภาพ การวินิจฉัย และการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">พื้นผิวเว็บที่โฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>1 จาก 4 (25%) / 1 จาก 4 (25%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและการค้นพบบนเครือข่าย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Node และความสามารถระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้ของโปรโตคอล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">บทบาทและสิทธิ์อนุญาต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมความปลอดภัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อ WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>1 จาก 8 (12.5%) / 1 จาก 8 (12.5%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 ด้าน">
    <p className="maturity-readiness-summary">5 ต้องตรวจทาน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการปฏิบัติงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 16 (0%) / 0 จาก 16 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 16 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 16 (0%) / 0 จาก 16 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 16 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google provider path - 5 areas">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ขอบเขต</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Gemini โดยตรง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อ การค้นหา และเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางโมเดลและปลายทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแคชพรอมต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าผู้ให้บริการและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Image, video, and music generation tools - 5 areas">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ขอบเขต</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างภาพ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการค้นพบสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างเพลง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตและการส่งมอบงาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างวิดีโอ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage and BlueBubbles - 5 areas">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ขอบเขต</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบริช</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS app - 8 areas">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 8 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ขอบเขต</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แคนวาสและหน้าจอ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แชตและเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">คำสั่งอุปกรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการวินิจฉัย Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและการแชร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแจ้งเตือนและการทำงานเบื้องหลัง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานเต็มรูปแบบ</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="การโฮสต์ Kubernetes - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและการเปิดเผย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตของคลัสเตอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่าและข้อมูลลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าการปรับใช้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอปคู่หู Linux - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่แอป</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แชทและเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความสามารถของเดสก์ท็อป</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะและการวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างความสามารถ 7 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="โฮสต์ Gateway บน Linux - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เป้าหมายการปรับใช้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ Gateway และการควบคุมบริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการอัปเดตโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงระยะไกลและความปลอดภัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ผู้ให้บริการโมเดลภายในเครื่อง: Ollama, vLLM, SGLang, LM Studio - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">หน่วยความจำภายในเครื่องและ Embeddings</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ผู้ให้บริการแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความปลอดภัยของเครือข่ายและการควบคุมพรอมต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้ของรันไทม์ที่รองรับ OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า วงจรชีวิต และการวินิจฉัยของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างความสามารถ 12 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ผู้ให้บริการแบบโฮสต์กลุ่มหางยาว - 3 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 3 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการ LLM แบบโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการสื่อแบบโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินงานของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างความสามารถ 12 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอปคู่หู macOS - 8 ด้าน">
    <p className="maturity-readiness-summary">8 รายการต้องตรวจสอบ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าในเครื่อง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความสามารถแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat ระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะและการตั้งค่า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงและการพูดคุย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="โฮสต์ Gateway บน macOS - 7 ด้าน">
    <p className="maturity-readiness-summary">7 รายการต้องตรวจสอบ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยและการสังเกตการณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตบริการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การผสานรวม Gateway ในเครื่อง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สิทธิ์และความสามารถแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โปรไฟล์และการแยกส่วน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โหมด Gateway ระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 ด้าน">
    <p className="maturity-readiness-summary">6 รายการต้องตรวจสอบ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้ารหัสและการตรวจสอบยืนยัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหารูปแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 4 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="การทำความเข้าใจสื่อและการสร้างสื่อ - 6 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 4 รายการ / ตรวจทานบางส่วน 2 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการสื่อของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่าสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>1 จาก 17 (5.9%) / 1 จาก 19 (5.3%)</span>
        <span>ช่องว่างด้านความสามารถ 18 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การรับเข้าและการเข้าถึงสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การทำความเข้าใจสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 12 (0%) / 1 จาก 14 (7.1%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งมอบข้อความเป็นเสียงพูด</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows แบบเนทีฟ - 4 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 4 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เครือข่าย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอัปเดต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอปคู่หูแบบเนทีฟสำหรับ Windows - 5 ด้าน">
    <p className="maturity-readiness-summary">5 ด้านต้องตรวจทาน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เซสชันแชท</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>2 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เครื่องมือเดสก์ท็อปและสิทธิ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>10 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>3 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การติดตั้งและการอัปเดต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>4 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางการติดตั้ง Nix - 5 ด้าน">
    <p className="maturity-readiness-summary">5 ด้านต้องตรวจทาน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเปิดใช้งานและ UX ของแอป</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>7 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่าและสถานะ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>7 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งต่อการติดตั้ง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>4 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิต Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>4 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime ของบริการและการป้องกัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>8 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ OpenAI และ Codex - 5 ด้าน">
    <p className="maturity-readiness-summary">2 ด้านต้องตรวจทาน / 3 ด้านตรวจทานบางส่วนแล้ว</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">อินพุตรูปภาพและหลายโหมด</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>2 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โมเดลและการยืนยันตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 6 (16.7%) / 4 จาก 9 (44.4%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Harness แบบเนทีฟของ Codex</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 4 จาก 9 (44.4%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตอบสนองและความเข้ากันได้ของเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 4 (25%) / 2 จาก 5 (40%)</span>
        <span>3 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงและเสียงแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>2 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6 ด้าน">
    <p className="maturity-readiness-summary">5 ด้านต้องตรวจทาน / 1 ด้านตรวจทานบางส่วนแล้ว</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสนทนาของเอเจนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>6 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API ไคลเอนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>4 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เหตุการณ์และการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึง Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ตัวช่วยทรัพยากร</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 6 (16.7%)</span>
        <span>5 ช่องว่างด้านความสามารถ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ OpenRouter - 4 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์แชตและการปรับให้เป็นรูปแบบมาตรฐาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 15 (0%) / 0 จาก 15 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 15 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างสื่อและเสียงพูด</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกู้คืนและการวินิจฉัยของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการยืนยันตัวตนของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 14 (0%) / 0 จาก 14 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 14 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin - 9 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 6 รายการ / ตรวจสอบบางส่วนแล้ว 3 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเขียนและจัดแพ็กเกจ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ที่มาพร้อมชุดติดตั้ง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การติดตั้งและเรียกใช้ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบบางส่วนแล้ว - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 7 จาก 20 (35%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอนุมัติ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ผู้ให้บริการและเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบบางส่วนแล้ว - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 6 (16.7%) / 9 จาก 21 (42.9%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การทดสอบ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบบางส่วนแล้ว - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 3 จาก 11 (27.3%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก - 4 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ประสิทธิภาพและการวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงระยะไกลและการยืนยันตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและความเข้ากันได้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ความปลอดภัย การยืนยันตัวตน การจับคู่ และความลับ - 6 พื้นที่">
    <p className="maturity-readiness-summary">ตรวจสอบบางส่วนแล้ว 2 รายการ / ต้องตรวจสอบ 4 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">นโยบายการอนุมัติและมาตรการป้องกันสำหรับเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบบางส่วนแล้ว - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 3 จาก 6 (50%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมการเข้าถึงช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สุขอนามัยของข้อมูลประจำตัวและความลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบบางส่วนแล้ว - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 5 จาก 11 (45.5%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจับคู่อุปกรณ์และ Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การยืนยันตัวตนของ Gateway และการเข้าถึงระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความไว้วางใจต่อ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เซสชัน หน่วยความจำ และเอนจินบริบท - 9 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 2 รายการ / ตรวจทานแล้วบางส่วน 7 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการเซสชัน CLI และทรานสคริปต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เอนจินบริบท</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 4 จาก 7 (57.1%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">พรอมต์และบริบทหลัก</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 3 จาก 8 (37.5%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ประวัติข้ามไคลเอนต์และความเท่าเทียมของเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 2 จาก 5 (40%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัย การบำรุงรักษา และการกู้คืน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 4 จาก 10 (40%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">หน่วยความจำ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 6 จาก 13 (46.2%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 1 จาก 4 (25%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการโทเค็น</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 2 จาก 10 (20%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การคงอยู่ของทรานสคริปต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบริช</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบริช</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบริช</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="การสังเกตการณ์ - 5 พื้นที่">
    <p className="maturity-readiness-summary">ตรวจทานบางส่วน 3 รายการ / ต้องตรวจทาน 2 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การรวบรวมข้อมูลวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>1 จาก 8 (12.5%) / 3 จาก 10 (30%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะระบบและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>1 จาก 12 (8.3%) / 5 จาก 18 (27.8%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การบันทึกล็อก</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งออก Telemetry</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>1 จาก 13 (7.7%) / 7 จาก 21 (33.3%)</span>
        <span>ช่องว่างด้านความสามารถ 14 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">อินพุตและคำสั่ง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเรียกใช้เชลล์ภายในเครื่อง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแสดงผลและความปลอดภัยของเอาต์พุต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โหมดรันไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 14 (0%) / 0 จาก 14 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 14 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เสียงและการพูดคุยแบบเรียลไทม์ - 6 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 6 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การพูดคุยในแอปแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เซสชันการพูดคุยแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">คำพูดและการถอดเสียง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสังเกตการณ์การพูดคุย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการการพูดคุย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การปลุกด้วยเสียงและการกำหนดเส้นทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ช่องทางการโทรด้วยเสียง - 5 พื้นที่">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>พื้นที่</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าช่องทางและการดำเนินงาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบริช</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงและการโทรแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบอนุกรมวิธานแบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="พื้นผิว companion ของ watchOS - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งมอบและการกู้คืน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่และการสนับสนุน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอนุมัติการดำเนินการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแจ้งเตือนและการตอบกลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI ของแอป Watch</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เครื่องมือค้นหาเว็บ - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 2 รายการ / ตรวจทานบางส่วนแล้ว 2 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความปลอดภัยของเครือข่าย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการค้นหา</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>2 จาก 19 (10.5%) / 2 จาก 19 (10.5%)</span>
        <span>ช่องว่างด้านความสามารถ 17 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความพร้อมใช้งานของเครื่องมือและการดึงข้อมูล</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>2 จาก 11 (18.2%) / 3 จาก 12 (25%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบ Rich</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows ผ่าน WSL2 - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจทาน 5 รายการ / ตรวจทานบางส่วนแล้ว 1 รายการ</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เบราว์เซอร์และ UI ควบคุม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจทานบางส่วนแล้ว - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>1 จาก 6 (16.7%) / 3 จาก 8 (37.5%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและการเปิดเผย Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตบริการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจทาน - การตรวจสอบ taxonomy แบบเต็ม</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> อัปเดตล่าสุด: 2026-06-22
