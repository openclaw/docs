---
summary: คะแนนความพร้อมสำหรับการเผยแพร่ OpenClaw ในด้านต่าง ๆ ของผลิตภัณฑ์ การผสานรวม และเวิร์กโฟลว์ที่รองรับ
title: ตารางประเมินระดับความพร้อมใช้งาน
x-i18n:
    generated_at: "2026-07-12T16:19:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# ตารางคะแนนวุฒิภาวะ

<div className="maturity-hero">
  <p className="maturity-kicker">ความพร้อมสำหรับการเผยแพร่ - สร้างจากอนุกรมวิธานและหลักฐาน QA</p>
  <p className="maturity-hero-title">ภาพรวมเชิงปฏิบัติของสิ่งที่พร้อม สิ่งที่ได้รับการพิสูจน์แล้ว และสิ่งที่ยังต้องปรับปรุง</p>
  <p>50 พื้นผิว - 281 ขอบเขตความสามารถ - ความครอบคลุมที่กำหนดผลได้แน่นอน พร้อมคุณภาพและความสมบูรณ์ที่ผ่านการตรวจสอบโดยมนุษย์</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">เรียกดูพื้นผิว</a> / <a href="#qa-evidence-summary">ตรวจสอบหลักฐาน QA</a> / <a href="/th/maturity/taxonomy">อ่านอนุกรมวิธาน</a></p>
</div>

## หน้านี้มีไว้เพื่ออะไร

ใช้หน้านี้เพื่อตอบคำถามหนึ่งข้อ: พื้นผิวใดของ OpenClaw เป็นตัวเลือกที่น่าเชื่อถือสำหรับการเผยแพร่ และมีหลักฐานใดสนับสนุนการประเมินนั้น ความครอบคลุมมาจากหลักฐาน QA ที่กำหนดผลได้แน่นอน ส่วนคุณภาพและความสมบูรณ์ได้รับการดูแลในรูปแบบคะแนนวุฒิภาวะที่ผ่านการตรวจสอบ

## ภาพรวมโดยย่อ

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>คะแนนวุฒิภาวะ</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">อัลฟา</span>
      <span>คุณภาพ + ความสมบูรณ์</span>
      <span>ความครอบคลุม ระยะทดลอง - 4%</span>
      <span>คุณภาพ อัลฟา - 64%</span>
      <span>ความสมบูรณ์ เบตา - 71%</span>
    </div>
  </div>
</div>

ความครอบคลุมยึดหลักฐานเป็นตัวนำโดยเจตนา กล่าวคือ ขอบเขตหนึ่งจะไม่ถือว่า "พร้อม" เพียงเพราะมีการนำไปใช้งานแล้ว ความครอบคลุมไม่ใช่ข้อมูลนำเข้าสำหรับคะแนนวุฒิภาวะ แต่ OpenClaw มุ่งรักษาความครอบคลุมแบบต้นทางถึงปลายทางให้สูงกว่า 90% สำหรับฟีเจอร์ที่มีวุฒิภาวะระดับเสถียรขึ้นไปในระยะยาว

## ช่วงคะแนน

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">เบตา</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">เสถียร</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">ยอดเยี่ยมระดับ Clawesome</span></span><span>95-100%</span></div>
</div>

## เครื่องมือสำรวจพื้นผิว

<a id="surface-explorer" />

พื้นผิวต่าง ๆ เรียงตามระดับวุฒิภาวะ ความสมบูรณ์ และคุณภาพ โดยแสดงการรองรับ LTS ควบคู่กับแต่ละแถว เพื่อให้เปรียบเทียบตัวเลือกที่พร้อมสำหรับการเผยแพร่ได้ง่าย

  <Tabs>
  <Tab title="ทุกส่วน">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>ส่วน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การรองรับ</span></div>
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
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">โฮสต์ Gateway บน Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">โฮสต์ Gateway บน macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#android-app"><span className="maturity-surface-title">แอป Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#ios-app"><span className="maturity-surface-title">แอป iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">รันไทม์ของเอเจนต์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">กลไกเซสชัน หน่วยความจำ และบริบท</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">เฟรมเวิร์กช่องทาง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">เครื่องมือระบบอัตโนมัติของเบราว์เซอร์ การประมวลผลคำสั่ง และแซนด์บ็อกซ์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#observability"><span className="maturity-surface-title">ความสามารถในการสังเกตการณ์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenAI และ Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">เว็บแอป Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">เครื่องมือค้นหาเว็บ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">ความปลอดภัย การยืนยันตัวตน การจับคู่ และข้อมูลลับ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">ระบบอัตโนมัติ: Cron, ฮุก, งาน, การสำรวจสถานะ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">การโฮสต์ด้วย Docker และ Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows ผ่าน WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็มรูปแบบ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็มรูปแบบ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage และ BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">แอปคู่หูสำหรับ macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">การทำความเข้าใจและการสร้างสื่อ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">เครื่องมือสร้างรูปภาพ วิดีโอ และดนตรี</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ผู้ให้บริการโมเดลภายในเครื่อง: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ผู้ให้บริการแบบโฮสต์เฉพาะกลุ่ม</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">เสียงและการสนทนาแบบเรียลไทม์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows แบบเนทีฟ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">การโฮสต์บน Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal และช่องทางระดับภูมิภาค</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK แอป OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
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
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">ช่องทางการโทรด้วยเสียง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">ส่วนติดต่อร่วมสำหรับ watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">แอปร่วมสำหรับ Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">แอปร่วมแบบเนทีฟสำหรับ Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="แกนหลัก">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>ส่วนพื้นผิว</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การรองรับ</span></div>
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
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">รันไทม์ของเอเจนต์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">กลไกเซสชัน หน่วยความจำ และบริบท</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">เฟรมเวิร์กช่องทาง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#observability"><span className="maturity-surface-title">ความสามารถในการสังเกตการณ์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">เว็บแอป Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">ความปลอดภัย การยืนยันตัวตน การจับคู่ และข้อมูลลับ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">ระบบอัตโนมัติ: Cron, ฮุก, งาน, การสำรวจสถานะ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">การทำความเข้าใจและการสร้างสื่อ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">เสียงและการสนทนาแบบเรียลไทม์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>4 ส่วน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK แอป OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>6 ส่วน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="แพลตฟอร์ม">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>ส่วนระบบ</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การรองรับ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">โฮสต์ Gateway บน Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>5 ส่วน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">โฮสต์ Gateway บน macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ส่วน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#android-app"><span className="maturity-surface-title">แอป Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ส่วน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#ios-app"><span className="maturity-surface-title">แอป iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>8 ส่วน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">การโฮสต์ด้วย Docker และ Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows ผ่าน WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">แอปคู่หูสำหรับ macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>8 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows แบบเนทีฟ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">การโฮสต์ด้วย Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">เส้นทางการติดตั้ง Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ขั้นทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">ส่วนติดต่อของแอปคู่หู watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ขั้นทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">แอปคู่หูสำหรับ Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">แอปคู่หูแบบเนทีฟสำหรับ Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="ช่องทาง">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>ส่วนติดต่อ</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การรองรับ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็มรูปแบบ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">เต็มรูปแบบ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage และ BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, ช่องทางระดับภูมิภาค</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">ช่องทางการโทรด้วยเสียง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ขั้นทดลอง</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Provider and tool">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>ส่วนงาน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>การสนับสนุน</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">เครื่องมือทำงานอัตโนมัติบนเบราว์เซอร์, exec และแซนด์บ็อกซ์</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenAI และ Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">เครื่องมือค้นหาเว็บ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">เครื่องมือสร้างรูปภาพ วิดีโอ และเพลง</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ผู้ให้บริการโมเดลภายในเครื่อง: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/th/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ผู้ให้บริการแบบโฮสต์เฉพาะกลุ่ม</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>3 ด้าน</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความครอบคลุม</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">คุณภาพ</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">ความสมบูรณ์</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">ไม่มี</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## สรุปหลักฐาน QA

การตรวจสอบด้านล่างแสดงว่าส่วนใดของตารางประเมินได้รับการทดสอบโดยหลักฐานจากโปรไฟล์ QA

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">การตรวจสอบอนุกรมวิธานทั้งหมด</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>ตรวจสอบ 96 รายการ - ผ่าน 94 รายการ, ถูกบล็อก 2 รายการ</span>
    <span>0 จาก 281 (0%) ด้าน - 20 จาก 1675 (1.2%) ความสามารถ - 77 จาก 1665 (4.6%) รหัสความครอบคลุม</span>
  </div>
</div>

### ความพร้อมแยกตามด้าน

เปิดพื้นผิวเพื่อดูสถานะหลักฐานของแต่ละหมวดหมู่ รายการจะยังคงยุบไว้เพื่อให้มองภาพรวมของหน้าได้อย่างสะดวก

<AccordionGroup>
  <Accordion title="รันไทม์ของเอเจนต์ - 9 ด้าน">
    <p className="maturity-readiness-summary">ตรวจสอบแล้วบางส่วน 8 ด้าน / ต้องตรวจสอบ 1 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ความสามารถ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินการรอบของเอเจนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 7 จาก 24 (29.2%)</span>
        <span>ช่องว่างด้านความสามารถ 17 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ภายนอกและเอเจนต์ย่อย</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 3 จาก 10 (30%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินการผ่านผู้ให้บริการแบบโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 5 (20%) / 1 จาก 5 (20%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการภายในเครื่องและแบบโฮสต์ด้วยตนเอง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเลือกโมเดลและรันไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 2 จาก 8 (25%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การยืนยันตัวตนกับผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 4 จาก 17 (23.5%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสตรีมและความคืบหน้า</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 5 จาก 9 (55.6%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเรียกใช้เครื่องมือและการจัดการการตอบกลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 15 จาก 23 (65.2%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมการดำเนินการของเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 6 จาก 12 (50%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอป Android - 7 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 7 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ความสามารถ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าการเชื่อมต่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ของอุปกรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การบันทึกสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แชตบนอุปกรณ์เคลื่อนที่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางของผู้ให้บริการ Anthropic - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ความสามารถ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ข้อมูลเข้าสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเลือกโมเดลและรันไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แคชพรอมต์และบริบท</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การยืนยันตัวตนกับผู้ให้บริการและการกู้คืน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งคำขอและความหมายของรอบการทำงาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ระบบอัตโนมัติ: Cron, ฮุก, งาน, การสำรวจเป็นระยะ - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน / ตรวจสอบแล้วบางส่วน 1 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ฮุกสำหรับระบบอัตโนมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">งานและโฟลว์เบื้องหลัง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">งาน Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 15 (0%) / 0 จาก 15 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 15 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การรับเหตุการณ์ขาเข้า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 15 (0%) / 0 จาก 15 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 15 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 7 (14.3%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมการสำรวจเป็นระยะ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ระบบอัตโนมัติของเบราว์เซอร์ การเรียกใช้ และเครื่องมือแซนด์บ็อกซ์ - 3 ด้าน">
    <p className="maturity-readiness-summary">ตรวจสอบแล้วบางส่วน 2 ด้าน / ต้องตรวจสอบ 1 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ระบบอัตโนมัติของเบราว์เซอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 8 (12.5%) / 1 จาก 8 (12.5%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">นโยบายแซนด์บ็อกซ์และเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเรียกและดำเนินการเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>2 จาก 6 (33.3%) / 4 จาก 8 (50%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เว็บแอป Gateway - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 3 ด้าน / ตรวจสอบแล้วบางส่วน 3 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและความเชื่อถือของเบราว์เซอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสนทนาแบบเรียลไทม์ผ่านเบราว์เซอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ส่วนติดต่อผู้ใช้ของเบราว์เซอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 1 จาก 12 (8.3%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">คอนโซลผู้ดำเนินการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 1 จาก 12 (8.3%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสนทนา WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 15 (0%) / 2 จาก 20 (10%)</span>
        <span>ช่องว่างด้านความสามารถ 18 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เฟรมเวิร์กช่องทาง - 8 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน / ตรวจสอบแล้วบางส่วน 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">คำสั่งการดำเนินการและการอนุมัติของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 7 (14.3%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 5 จาก 27 (18.5%)</span>
        <span>ช่องว่างด้านความสามารถ 22 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ลักษณะการทำงานของเธรดกลุ่มและห้องแวดล้อม</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 4 จาก 11 (36.4%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เกตควบคุมการเข้าถึงขาเข้าและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ไฟล์แนบสื่อและข้อมูลช่องทางแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ไปป์ไลน์การส่งขาออกและการตอบกลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 8 จาก 21 (38.1%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะความพร้อมใช้งานและการควบคุมสำหรับผู้ดำเนินการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การค้นพบแค็ตตาล็อก</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้และความน่าเชื่อถือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตและสถานะของ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 26 (0%) / 0 จาก 26 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 26 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน / ตรวจสอบแล้วบางส่วน 2 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความสามารถในการสังเกตการณ์ของ CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>1 จาก 6 (16.7%) / 1 จาก 6 (16.7%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการบริการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 7 (14.3%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเริ่มต้นใช้งานและการตั้งค่าการยืนยันตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า Plugin และช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอัปเดตและการอัปเกรด</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 6 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงและการโทรแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="การโฮสต์ด้วย Docker และ Podman - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 3 ด้าน / ตรวจสอบแล้วบางส่วน 1 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แซนด์บ็อกซ์และเครื่องมือสำหรับเอเจนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินงานคอนเทนเนอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าคอนเทนเนอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่และการตรวจสอบอิมเมจ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานอย่างครบถ้วน</span>
        </div>
        <span>1 จาก 5 (20%) / 2 จาก 7 (28.6%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, ช่องทางระดับภูมิภาค - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ขาดความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ขาดความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ขาดความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ขาดความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="รันไทม์ Gateway - 13 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 9 ด้าน / ตรวจสอบแล้วบางส่วน 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอนุมัติและการดำเนินการจากระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ขาดความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การยืนยันตัวตนอุปกรณ์และการจับคู่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ขาดความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตของ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 4 จาก 12 (33.3%)</span>
        <span>ขาดความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API แบบ RPC และเหตุการณ์ของ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 20 (0%) / 2 จาก 22 (9.1%)</span>
        <span>ขาดความสามารถ 20 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะระบบ การวินิจฉัย และการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ขาดความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ส่วนติดต่อเว็บที่โฮสต์ไว้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ขาดความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API แบบ HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 4 (25%) / 1 จาก 4 (25%)</span>
        <span>ขาดความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและการค้นพบเครือข่าย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ขาดความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Node และความสามารถจากระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ขาดความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้ของโปรโตคอล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ขาดความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">บทบาทและสิทธิ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ขาดความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">มาตรการควบคุมความปลอดภัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ขาดความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อ WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 8 (12.5%) / 1 จาก 8 (12.5%)</span>
        <span>ขาดความสามารถ 7 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ขาดความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 16 (0%) / 0 จาก 16 (0%)</span>
        <span>ขาดความสามารถ 16 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ขาดความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ขาดความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 16 (0%) / 0 จาก 16 (0%)</span>
        <span>ขาดความสามารถ 16 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ Google - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ Gemini โดยตรง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อ การค้นหา และการทำงานแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางโมเดลและปลายทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแคชพรอมต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าผู้ให้บริการและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เครื่องมือสร้างรูปภาพ วิดีโอ และเพลง - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างรูปภาพ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการค้นพบสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างเพลง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตและการส่งมอบงาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างวิดีโอ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage และ BlueBubbles - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอป iOS - 8 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 8 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แคนวาสและหน้าจอ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">แชตและเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">คำสั่งอุปกรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการวินิจฉัย Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและการแชร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแจ้งเตือนและการทำงานเบื้องหลัง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="การโฮสต์บน Kubernetes - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและการเปิดให้เข้าถึง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตของคลัสเตอร์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่าและข้อมูลลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าการปรับใช้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอปคู่หูสำหรับ Linux - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่แอป</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแชตและเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความสามารถของเดสก์ท็อป</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะและการวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="โฮสต์ Gateway บน Linux - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เป้าหมายการปรับใช้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ Gateway และการควบคุมบริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการอัปเดตโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงระยะไกลและความปลอดภัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ผู้ให้บริการโมเดลภายในเครื่อง: Ollama, vLLM, SGLang, LM Studio - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">หน่วยความจำภายในเครื่องและเวกเตอร์ฝังตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin สำหรับผู้ให้บริการแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความปลอดภัยของเครือข่ายและการควบคุมพรอมต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้กับรันไทม์ที่รองรับ OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า วงจรชีวิต และการวินิจฉัยผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ผู้ให้บริการแบบโฮสต์ที่มีการใช้งานเฉพาะกลุ่ม - 3 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 3 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>คุณลักษณะ / รหัสความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการ LLM แบบโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการสื่อแบบโฮสต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินงานของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอปคู่หูบน macOS - 8 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 8 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าในเครื่อง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความสามารถแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat ระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะและการตั้งค่า</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงและการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="โฮสต์ Gateway บน macOS - 7 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 7 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยและความสามารถในการสังเกตการณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตของบริการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การผสานรวม Gateway ในเครื่อง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สิทธิ์และความสามารถแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โปรไฟล์และการแยกส่วน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โหมด Gateway ระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 6 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้ารหัสและการยืนยัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="การทำความเข้าใจและการสร้างสื่อ - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน / ตรวจสอบแล้วบางส่วน 2 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการสื่อของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่าสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 17 (5.9%) / 1 จาก 19 (5.3%)</span>
        <span>ช่องว่างด้านความสามารถ 18 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การรับและการเข้าถึงสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การทำความเข้าใจสื่อ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 12 (0%) / 1 จาก 14 (7.1%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งข้อความเป็นเสียงพูด</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows แบบเนทีฟ - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เครือข่าย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอัปเดต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="แอปคู่หูแบบเนทีฟสำหรับ Windows - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เซสชันแชต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เครื่องมือเดสก์ท็อปและสิทธิ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเชื่อมต่อ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การติดตั้งและการอัปเดต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางการติดตั้ง Nix - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเปิดใช้งานและประสบการณ์ผู้ใช้ของแอป</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดค่าและสถานะ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งต่อการติดตั้ง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตของ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ของบริการและกลไกป้องกัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ OpenAI และ Codex - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 2 ด้าน / ตรวจสอบแล้วบางส่วน 3 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">อินพุตรูปภาพและหลายรูปแบบ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โมเดลและการยืนยันตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 6 (16.7%) / 4 จาก 9 (44.4%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ชุดควบคุม Codex แบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 4 จาก 9 (44.4%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตอบกลับและความเข้ากันได้ของเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 4 (25%) / 2 จาก 5 (40%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงพูดและเสียงแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน / ตรวจสอบแล้วบางส่วน 1 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / ID ความครอบคลุม</span><span>การดำเนินการต่อ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสนทนาของเอเจนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API ไคลเอนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความเข้ากันได้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เหตุการณ์และการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึง Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ตัวช่วยจัดการทรัพยากร</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 1 จาก 6 (16.7%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ OpenRouter - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์แชตและการปรับให้เป็นมาตรฐาน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 15 (0%) / 0 จาก 15 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 15 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสร้างสื่อและเสียงพูด</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกู้คืนและการวินิจฉัยผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการยืนยันตัวตนของผู้ให้บริการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 14 (0%) / 0 จาก 14 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 14 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin - 9 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 6 ด้าน / ตรวจสอบแล้วบางส่วน 3 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การพัฒนาและจัดแพ็กเกจ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ที่รวมมาให้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การติดตั้งและเรียกใช้ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 7 จาก 20 (35%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอนุมัติ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ผู้ให้บริการและเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 6 (16.7%) / 9 จาก 21 (42.9%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การทดสอบ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 3 จาก 11 (27.3%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">รันไทม์ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ประสิทธิภาพและการวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงระยะไกลและการยืนยันตัวตน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและความเข้ากันได้</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 12 (0%) / 0 จาก 12 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 12 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ความปลอดภัย การยืนยันตัวตน การจับคู่ และข้อมูลลับ - 6 ด้าน">
    <p className="maturity-readiness-summary">ตรวจสอบแล้วบางส่วน 2 ด้าน / ต้องตรวจสอบ 4 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">นโยบายการอนุมัติและมาตรการป้องกันของเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 3 จาก 6 (50%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมการเข้าถึงช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดูแลข้อมูลประจำตัวและข้อมูลลับอย่างปลอดภัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 5 จาก 11 (45.5%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจับคู่อุปกรณ์และ Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การยืนยันตัวตนของ Gateway และการเข้าถึงระยะไกล</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความน่าเชื่อถือของ Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เซสชัน หน่วยความจำ และกลไกบริบท - 9 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 2 ด้าน / ตรวจสอบแล้วบางส่วน 7 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการเซสชันและบันทึกการสนทนาผ่าน CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">กลไกบริบท</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 4 จาก 7 (57.1%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">พรอมต์หลักและบริบท</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 3 จาก 8 (37.5%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความสอดคล้องของประวัติและเซสชันระหว่างไคลเอนต์</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 2 จาก 5 (40%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัย การบำรุงรักษา และการกู้คืน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 4 จาก 10 (40%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">หน่วยความจำ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 6 จาก 13 (46.2%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 1 จาก 4 (25%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการโทเค็น</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 2 จาก 10 (20%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดเก็บบันทึกการสนทนาอย่างถาวร</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาที่หลากหลาย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาที่หลากหลาย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาที่หลากหลาย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ความสามารถในการสังเกตการณ์ - 5 ด้าน">
    <p className="maturity-readiness-summary">ตรวจสอบแล้วบางส่วน 3 ด้าน / ต้องตรวจสอบ 2 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การรวบรวมข้อมูลวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 8 (12.5%) / 3 จาก 10 (30%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สถานะระบบและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 12 (8.3%) / 5 จาก 18 (27.8%)</span>
        <span>ช่องว่างด้านความสามารถ 13 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การบันทึกล็อก</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งออกข้อมูลโทรมาตร</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 13 (7.7%) / 7 จาก 21 (33.3%)</span>
        <span>ช่องว่างด้านความสามารถ 14 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">อินพุตและคำสั่ง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การดำเนินการเชลล์ภายในเครื่อง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแสดงผลและความปลอดภัยของเอาต์พุต</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">โหมดรันไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 14 (0%) / 0 จาก 14 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 14 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การจัดการเซสชัน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เสียงและการสนทนาแบบเรียลไทม์ - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 6 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การสนทนาในแอปแบบเนทีฟ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เซสชันการสนทนาแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงพูดและการถอดเสียง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความสามารถในการสังเกตการณ์การสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การปลุกด้วยเสียงและการกำหนดเส้นทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ช่องทางการโทรด้วยเสียง - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและอัตลักษณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งมอบบทสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 1 (0%) / 0 จาก 1 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 1 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เสียงและการโทรแบบเรียลไทม์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - การตรวจสอบความถูกต้องของอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="พื้นผิวแอปคู่หูบน watchOS - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การส่งและการกู้คืน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเผยแพร่และการสนับสนุน</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การอนุมัติการดำเนินการ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การแจ้งเตือนและการตอบกลับ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI ของแอปบนนาฬิกา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 3 (0%) / 0 จาก 3 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 3 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="เครื่องมือค้นหาเว็บ - 4 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 2 ด้าน / ตรวจสอบแล้วบางส่วน 2 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความปลอดภัยของเครือข่าย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ผู้ให้บริการค้นหา</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>2 จาก 19 (10.5%) / 2 จาก 19 (10.5%)</span>
        <span>ช่องว่างด้านความสามารถ 17 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการวินิจฉัย</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 9 (0%) / 0 จาก 9 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ความพร้อมใช้งานและการดึงข้อมูลของเครื่องมือ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>2 จาก 11 (18.2%) / 3 จาก 12 (25%)</span>
        <span>ช่องว่างด้านความสามารถ 9 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 7 (0%) / 0 จาก 7 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 7 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 5 (0%) / 0 จาก 5 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การกำหนดเส้นทางและการส่งการสนทนา</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 4 (0%) / 0 จาก 4 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 4 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ตัวควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 2 (0%) / 0 จาก 2 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 2 รายการ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows ผ่าน WSL2 - 6 ด้าน">
    <p className="maturity-readiness-summary">ต้องตรวจสอบ 5 ด้าน / ตรวจสอบแล้วบางส่วน 1 ด้าน</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>ด้าน</span><span>ฟีเจอร์ / รหัสความครอบคลุม</span><span>การติดตามผล</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">เบราว์เซอร์และ UI ควบคุม</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 8 (0%) / 0 จาก 8 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 8 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การวินิจฉัยและการซ่อมแซม</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">ตรวจสอบแล้วบางส่วน - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>1 จาก 6 (16.7%) / 3 จาก 8 (37.5%)</span>
        <span>ช่องว่างด้านความสามารถ 5 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การเข้าถึงและการเปิดเผย Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 11 (0%) / 0 จาก 11 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 11 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">วงจรชีวิตบริการ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 10 (0%) / 0 จาก 10 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 10 รายการ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">การตั้งค่า WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">ต้องตรวจสอบ - ตรวจสอบอนุกรมวิธานทั้งหมด</span>
        </div>
        <span>0 จาก 6 (0%) / 0 จาก 6 (0%)</span>
        <span>ช่องว่างด้านความสามารถ 6 รายการ</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> อัปเดตล่าสุด: 2026-06-22
