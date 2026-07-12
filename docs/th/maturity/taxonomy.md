---
summary: เอกสารอ้างอิงโดยละเอียดสำหรับด้านต่าง ๆ ของผลิตภัณฑ์และการตรวจสอบที่อยู่เบื้องหลังตารางประเมินระดับความพร้อมของ OpenClaw
title: อนุกรมวิธานระดับความพร้อมใช้งาน
x-i18n:
    generated_at: "2026-07-12T16:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0739da06341d9bd86cc3a98772c8cbfbcb9a5acf80ca5ac1005c86dafaf273b7
    source_path: maturity/taxonomy.md
    workflow: 16
---

# อนุกรมวิธานระดับความพร้อม

<div className="maturity-hero maturity-hero-compact">
  <p className="maturity-kicker">โมเดลเบื้องหลังตารางคะแนน</p>
  <p className="maturity-hero-title">พื้นผิว &gt; หมวดหมู่ &gt; ความสามารถ &gt; หลักฐาน</p>
  <p>พื้นผิว 50 รายการที่จัดกลุ่มเป็น 4 กลุ่ม โดยทุกหมวดหมู่เชื่อมโยงกลับไปยังเอกสารหลักและรหัสความครอบคลุมของ QA</p>
  <p className="maturity-jump-links"><a href="#product-areas">เรียกดูพื้นที่ผลิตภัณฑ์</a> / <a href="#taxonomy-details">เปิดอนุกรมวิธานแบบละเอียด</a> / <a href="/th/maturity/scorecard">ดูคะแนน</a></p>
</div>

## วิธีอ่านหน้านี้

พื้นผิวคือพื้นที่ของผลิตภัณฑ์ เช่น รันไทม์ Gateway, Discord หรือแอป macOS แต่ละพื้นผิวประกอบด้วยหมวดหมู่ และแต่ละหมวดหมู่ประกอบด้วยการตรวจสอบระดับความสามารถที่สถานการณ์จำลอง QA ครอบคลุม ใช้ตารางคะแนนเพื่อตัดสินในระดับรีลีส และใช้หน้านี้เพื่อตรวจสอบโมเดลที่เป็นพื้นฐานของตารางคะแนน

## ระดับความพร้อม

<div className="maturity-level-list">
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนแล้ว</span></span></span><span>ทราบทิศทางแล้ว แต่ยังไม่มีเส้นทางการใช้งานสำหรับผู้ใช้ที่รองรับ</span><span className="maturity-level-promotion">เกณฑ์เลื่อนระดับ: มีประเด็นด้านการออกแบบ ผู้รับผิดชอบ และพื้นผิวเป้าหมายแล้ว</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span></span><span>นำไปใช้แล้วโดยมีข้อควรระวัง แฟล็ก การบิลด์จากซอร์ส หรือขั้นตอนสำหรับผู้ดูแลเท่านั้น</span><span className="maturity-level-promotion">เกณฑ์เลื่อนระดับ: ผู้ดูแลสามารถเรียกใช้สถานการณ์จำลองจาก main ปัจจุบันได้</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span></span><span>ผู้ใช้จริงสามารถทดลองใช้ได้ แต่คาดว่าจะมีการเปลี่ยนแปลงที่ไม่เข้ากันและ UX ที่ยังไม่สมบูรณ์</span><span className="maturity-level-promotion">เกณฑ์เลื่อนระดับ: มีเอกสารการตั้งค่า การทดสอบพื้นฐาน ข้อควรระวังที่ทราบ และหลักฐานจากสภาพแวดล้อมจริงอย่างน้อยหนึ่งรายการ</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span></span><span>มีเส้นทางสาธารณะและเวิร์กโฟลว์หลักใช้งานได้โดยมีข้อควรระวังในขอบเขตที่จำกัด</span><span className="maturity-level-promotion">เกณฑ์เลื่อนระดับ: มีเอกสารการติดตั้ง/อัปเดต การทดสอบการถดถอย คู่มือปฏิบัติการสนับสนุน และหลักฐานว่าสถานการณ์จำลองสำเร็จในสภาพแวดล้อมที่คาดหมาย</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span></span><span>เส้นทางที่แนะนำสำหรับผู้ใช้ทั่วไป ความล้มเหลวจะถือเป็นการถดถอย</span><span className="maturity-level-promotion">เกณฑ์เลื่อนระดับ: มีเกณฑ์ควบคุมการรีลีส เส้นทาง doctor/การแก้ไขปัญหา เอกสารที่ครอบคลุม และหลักฐานจากการใช้งานจริงซ้ำหลายครั้ง</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-clawesome"><span className="maturity-level-code">M5</span><span>ยอดเยี่ยม</span></span></span><span>ประณีต น่าใช้งาน มีเครื่องมือวัดผลครบถ้วน และแข่งขันได้กับเวิร์กโฟลว์เทียบเคียงที่ดีที่สุด</span><span className="maturity-level-promotion">เกณฑ์เลื่อนระดับ: ผ่านระดับเสถียร รวมถึงผ่านตารางประเมินของผู้ใช้กับกลุ่มผู้ใช้ที่เป็นตัวแทน</span></div>
</div>

## พื้นที่ผลิตภัณฑ์

<a id="product-areas" />

<Tabs>
  <Tab title="แกนหลัก">

    <a className="maturity-surface-link" href="#cli">
      <span className="maturity-surface-title">CLI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 พื้นที่ - เสร็จสมบูรณ์ 90%</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-runtime">
      <span className="maturity-surface-title">รันไทม์ Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>13 พื้นที่ - เสร็จสมบูรณ์ 89%</span></span>
    </a>

    <a className="maturity-surface-link" href="#agent-runtime">
      <span className="maturity-surface-title">รันไทม์เอเจนต์</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 พื้นที่ - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#session-memory-and-context-engine">
      <span className="maturity-surface-title">เซสชัน หน่วยความจำ และเอนจินบริบท</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 พื้นที่ - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#channel-framework">
      <span className="maturity-surface-title">เฟรมเวิร์กช่องทาง</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>8 พื้นที่ - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#observability">
      <span className="maturity-surface-title">ความสามารถในการสังเกตการณ์</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 พื้นที่ - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-web-app">
      <span className="maturity-surface-title">เว็บแอป Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#plugins">
      <span className="maturity-surface-title">Plugin</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>9 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#security-auth-pairing-and-secrets">
      <span className="maturity-surface-title">ความปลอดภัย การยืนยันตัวตน การจับคู่ และข้อมูลลับ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#automation-cron-hooks-tasks-polling">
      <span className="maturity-surface-title">ระบบอัตโนมัติ: Cron, ฮุก, งาน และการสำรวจเป็นระยะ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#media-understanding-and-media-generation">
      <span className="maturity-surface-title">การทำความเข้าใจและการสร้างสื่อ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-and-realtime-talk">
      <span className="maturity-surface-title">เสียงและการสนทนาแบบเรียลไทม์</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#tui">
      <span className="maturity-surface-title">TUI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#clawhub">
      <span className="maturity-surface-title">ClawHub</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 62%</span></span>
    </a>

    <a className="maturity-surface-link" href="#openclaw-app-sdk">
      <span className="maturity-surface-title">SDK แอป OpenClaw</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>อัลฟา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 53%</span></span>
    </a>

  </Tab>
  <Tab title="แพลตฟอร์ม">

    <a className="maturity-surface-link" href="#linux-gateway-host">
      <span className="maturity-surface-title">โฮสต์ Gateway บน Linux</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 89%</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-gateway-host">
      <span className="maturity-surface-title">โฮสต์ Gateway บน macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน - เสร็จสมบูรณ์ 88%</span></span>
    </a>
    <a className="maturity-surface-link" href="#android-app">
      <span className="maturity-surface-title">แอป Android</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>7 ด้าน - เสร็จสมบูรณ์ 80%</span></span>
    </a>
    <a className="maturity-surface-link" href="#ios-app">
      <span className="maturity-surface-title">แอป iOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>8 ด้าน - เสร็จสมบูรณ์ 80%</span></span>
    </a>

    <a className="maturity-surface-link" href="#docker-and-podman-hosting">
      <span className="maturity-surface-title">การโฮสต์ด้วย Docker และ Podman</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#windows-via-wsl2">
      <span className="maturity-surface-title">Windows ผ่าน WSL2</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#raspberry-pi-and-small-linux-devices">
      <span className="maturity-surface-title">Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-companion-app">
      <span className="maturity-surface-title">แอปคู่หูสำหรับ macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>8 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>


    <a className="maturity-surface-link" href="#native-windows">
      <span className="maturity-surface-title">Windows แบบเนทีฟ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#kubernetes-hosting">
      <span className="maturity-surface-title">การโฮสต์บน Kubernetes</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 61%</span></span>
    </a>


    <a className="maturity-surface-link" href="#nix-install-path">
      <span className="maturity-surface-title">เส้นทางการติดตั้งด้วย Nix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 44%</span></span>
    </a>

    <a className="maturity-surface-link" href="#watchos-companion-surfaces">
      <span className="maturity-surface-title">ส่วนติดต่อคู่หูสำหรับ watchOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 44%</span></span>
    </a>

    <a className="maturity-surface-link" href="#linux-companion-app">
      <span className="maturity-surface-title">แอปคู่หูสำหรับ Linux</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 21%</span></span>
    </a>

    <a className="maturity-surface-link" href="#native-windows-companion-app">
      <span className="maturity-surface-title">แอปคู่หูสำหรับ Windows แบบเนทีฟ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>วางแผนไว้</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 21%</span></span>
    </a>

  </Tab>
  <Tab title="ช่องทาง">

    <a className="maturity-surface-link" href="#discord">
      <span className="maturity-surface-title">Discord</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>เสถียร</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 87%</span></span>
    </a>

    <a className="maturity-surface-link" href="#telegram">
      <span className="maturity-surface-title">Telegram</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#slack">
      <span className="maturity-surface-title">Slack</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#imessage-and-bluebubbles">
      <span className="maturity-surface-title">iMessage และ BlueBubbles</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#whatsapp">
      <span className="maturity-surface-title">WhatsApp</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#matrix">
      <span className="maturity-surface-title">Matrix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>6 ด้าน - เสร็จสมบูรณ์ 67%</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-chat">
      <span className="maturity-surface-title">Google Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#microsoft-teams">
      <span className="maturity-surface-title">Microsoft Teams</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#signal">
      <span className="maturity-surface-title">Signal</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels">
      <span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal และช่องทางระดับภูมิภาค</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 58%</span></span>
    </a>

    <a className="maturity-surface-link" href="#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat">
      <span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 54%</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-call-channel">
      <span className="maturity-surface-title">ช่องทางการโทรด้วยเสียง</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>ทดลอง</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 44%</span></span>
    </a>

  </Tab>
  <Tab title="ผู้ให้บริการและเครื่องมือ">

    <a className="maturity-surface-link" href="#browser-automation-exec-and-sandbox-tools">
      <span className="maturity-surface-title">เครื่องมือทำงานอัตโนมัติบนเบราว์เซอร์ การเรียกใช้คำสั่ง และแซนด์บ็อกซ์</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>3 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#openai-and-codex-provider-path">
      <span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenAI และ Codex</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#web-search-tools">
      <span className="maturity-surface-title">เครื่องมือค้นหาเว็บ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#anthropic-provider-path">
      <span className="maturity-surface-title">เส้นทางผู้ให้บริการ Anthropic</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-provider-path">
      <span className="maturity-surface-title">เส้นทางผู้ให้บริการ Google</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#openrouter-provider-path">
      <span className="maturity-surface-title">เส้นทางผู้ให้บริการ OpenRouter</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>เบตา</span></span><span>4 ด้าน - เสร็จสมบูรณ์ 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#image-video-and-music-generation-tools">
      <span className="maturity-surface-title">เครื่องมือสร้างรูปภาพ วิดีโอ และดนตรี</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#local-model-providers-ollama-vllm-sglang-lm-studio">
      <span className="maturity-surface-title">ผู้ให้บริการโมเดลภายในเครื่อง: Ollama, vLLM, SGLang, LM Studio</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>5 ด้าน - เสร็จสมบูรณ์ 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#long-tail-hosted-providers">
      <span className="maturity-surface-title">ผู้ให้บริการโฮสต์เฉพาะกลุ่ม</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>แอลฟา</span></span><span>3 ด้าน - เสร็จสมบูรณ์ 68%</span></span>
    </a>

  </Tab>
</Tabs>

## รายละเอียด

<a id="taxonomy-details" />

### แกนหลัก

<AccordionGroup>
  <Accordion title="CLI - M4 เสถียร - 7 ด้าน">
    <a id="cli" />

    เส้นทางการตั้งค่าและการซ่อมแซมตามปกติมีการจัดทำเอกสารไว้ในเอกสารการติดตั้ง CLI และ Gateway ส่วนเส้นทางเฉพาะแพลตฟอร์ม Windows จะติดตามไว้ในแถว Windows ผ่าน WSL2 และ Windows แบบเนทีฟ

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 4%</span><span>คุณภาพ ระดับเสถียร - 83%</span><span>ความสมบูรณ์ ระดับเสถียร - 90%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่า CLI</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/install/index), [ตัวติดตั้ง](/th/install/installer), [Node](/th/install/node), [การอัปเดต](/th/install/updating)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเริ่มต้นใช้งานและการตั้งค่าการยืนยันตัวตน</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[เริ่มต้นใช้งาน](/th/cli/onboard), [กำหนดค่า](/th/cli/configure), [ภาพรวมการเริ่มต้นใช้งาน](/th/start/onboarding-overview)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่า Plugin และช่องทาง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[เริ่มต้นใช้งาน](/th/cli/onboard), [Plugin](/th/cli/plugins), [ช่องทาง](/th/cli/channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การจัดการบริการ Gateway</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[Gateway](/th/cli/gateway), [การอัปเดต](/th/install/updating), [การแก้ไขปัญหา](/th/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความสามารถในการสังเกตการณ์ของ CLI</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[สถานะ](/th/cli/status), [สถานภาพ](/th/cli/health), [บันทึก](/th/cli/logs), [การวินิจฉัย](/th/gateway/diagnostics)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตรวจสอบและแก้ไข</span>
          <span>10 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[การตรวจสอบและแก้ไข](/th/cli/doctor), [การตรวจสอบและแก้ไข](/th/gateway/doctor), [ข้อมูลลับ](/th/gateway/secrets), [การแก้ไขปัญหา](/th/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การอัปเดตและการอัปเกรด</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[การอัปเดต](/th/install/updating), [อัปเดต](/th/cli/update), [การแก้ไขปัญหา](/th/gateway/troubleshooting)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="รันไทม์ Gateway - M4 เสถียร - 13 ด้าน">
    <a id="gateway-runtime" />

    สถาปัตยกรรมหลัก การยืนยันตัวตน การจับคู่ เอกสารโปรโตคอล เอกสารเดมอน และคู่มือปฏิบัติงาน CLI มีเนื้อหาครอบคลุมและเป็นปัจจุบัน

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ทดลอง - 6%</span><span>คุณภาพ เสถียร - 81%</span><span>ความสมบูรณ์ เสถียร - 89%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 12</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>พื้นที่</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การอนุมัติและการดำเนินการจากระยะไกล</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[โปรโตคอล](/th/gateway/protocol), [ดัชนี](/th/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API แบบ HTTP</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/index), [API HTTP ของ OpenAI](/th/gateway/openai-http-api), [API HTTP ของ OpenResponses](/th/gateway/openresponses-http-api), [API HTTP สำหรับเรียกใช้เครื่องมือ](/th/gateway/tools-invoke-http-api), [ฮุก](/th/automation/hooks), [ดัชนี](/th/web/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ส่วนติดต่อเว็บที่โฮสต์ไว้</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/index), [สถาปัตยกรรม](/th/concepts/architecture), [ส่วนติดต่อผู้ใช้สำหรับควบคุม](/th/web/control-ui), [เว็บแชต](/th/web/webchat), [แคนวาส](/th/refactor/canvas)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API แบบ RPC และเหตุการณ์ของ Gateway</span>
          <span>20 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[โปรโตคอล](/th/gateway/protocol), [ดัชนี](/th/gateway/index), [สถาปัตยกรรม](/th/concepts/architecture)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การยืนยันตัวตนอุปกรณ์และการจับคู่</span>
          <span>10 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[โปรโตคอล](/th/gateway/protocol), [การจับคู่](/th/gateway/pairing), [ดัชนี](/th/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและการค้นพบเครือข่าย</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/index), [การค้นพบ](/th/gateway/discovery), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Node และความสามารถจากระยะไกล</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[โปรโตคอล](/th/gateway/protocol), [สถาปัตยกรรม](/th/concepts/architecture), [ดัชนี](/th/nodes/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สถานะระบบ การวินิจฉัย และการซ่อมแซม</span>
          <span>7 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/index), [การวินิจฉัย](/th/gateway/diagnostics), [Doctor](/th/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความเข้ากันได้ของโปรโตคอล</span>
          <span>7 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[โปรโตคอล](/th/gateway/protocol), [สถาปัตยกรรม](/th/concepts/architecture), [Typebox](/th/concepts/typebox), [โปรโตคอลบริดจ์](/th/gateway/bridge-protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">บทบาทและสิทธิ์</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[โปรโตคอล](/th/gateway/protocol), [ดัชนี](/th/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">วงจรชีวิตของ Gateway</span>
          <span>7 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/index), [สถาปัตยกรรม](/th/concepts/architecture)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมความปลอดภัย</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/security/index), [โปรโตคอล](/th/gateway/protocol), [การค้นหา](/th/gateway/discovery)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเชื่อมต่อ WebSocket</span>
          <span>8 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[โปรโตคอล](/th/gateway/protocol), [สถาปัตยกรรม](/th/concepts/architecture)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="รันไทม์ของเอเจนต์ - M3 เบตา - 9 ด้าน">
    <a id="agent-runtime" />

    ลูปหลัก โมเดล การกำหนดเส้นทางผู้ให้บริการ และการสตรีมเครื่องมือเป็นองค์ประกอบหลักระดับแนวหน้า แต่พฤติกรรมของผู้ให้บริการเปลี่ยนแปลงทุกสัปดาห์และจำเป็นต้องมีหลักฐานจากสถานการณ์ทดสอบสำหรับแต่ละรุ่นที่เผยแพร่

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระยะทดลอง - 33%</span><span>คุณภาพ เบตา - 78%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การดำเนินการรอบการทำงานของเอเจนต์</span>
          <span>3 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ลูปของเอเจนต์](/th/concepts/agent-loop), [เอเจนต์](/th/cli/agent), [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รันไทม์ภายนอกและเอเจนต์ย่อย</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes), [Anthropic](/th/providers/anthropic), [Google](/th/providers/google), [เอเจนต์ย่อย](/th/tools/subagents)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การดำเนินการผ่านผู้ให้บริการแบบโฮสต์</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openai](/th/providers/openai), [Anthropic](/th/providers/anthropic), [Google](/th/providers/google), [โมเดล](/th/concepts/models)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ผู้ให้บริการภายในเครื่องและแบบโฮสต์ด้วยตนเอง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ollama](/th/providers/ollama), [โมเดล](/th/concepts/models), [เอเจนต์](/th/cli/agent)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเลือกโมเดลและรันไทม์</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[โมเดล](/th/concepts/models), [โมเดล](/th/cli/models), [Openai](/th/providers/openai), [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การยืนยันตัวตนกับผู้ให้บริการ</span>
          <span>10 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>24%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "24%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[โมเดล](/th/concepts/models), [เอเจนต์](/th/cli/agent), [โมเดล](/th/cli/models), [Openai](/th/providers/openai), [Anthropic](/th/providers/anthropic), [Google](/th/providers/google), [เอเจนต์ย่อย](/th/tools/subagents)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสตรีมและความคืบหน้า</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสตรีม](/th/concepts/streaming), [ลูปของเอเจนต์](/th/concepts/agent-loop)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเรียกใช้เครื่องมือและการจัดการการตอบกลับ</span>
          <span>3 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>65%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "65%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ลูปของเอเจนต์](/th/concepts/agent-loop), [Ollama](/th/providers/ollama)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมการเรียกใช้เครื่องมือ</span>
          <span>6 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ระดับสูง](/th/gateway/sandbox-vs-tool-policy-vs-elevated), [ลูปของเอเจนต์](/th/concepts/agent-loop), [เอเจนต์ย่อย](/th/tools/subagents)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เซสชัน หน่วยความจำ และกลไกบริบท - M3 เบต้า - 9 ด้าน">
    <a id="session-memory-and-context-engine" />

    เอกสารมีคุณภาพดีและมีการพัฒนาอย่างต่อเนื่อง ระดับความสมบูรณ์ขึ้นอยู่กับความคงทนของบันทึกการสนทนา คุณภาพของ Compaction และความเท่าเทียมกันระหว่างไคลเอนต์

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 30%</span><span>คุณภาพ ระดับเบต้า - 77%</span><span>ความครบถ้วน ระดับเบต้า - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>พื้นที่</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การจัดการเซสชันและทรานสคริปต์ผ่าน CLI</span>
          <span>2 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[เซสชัน](/th/concepts/session), [Compaction สำหรับการจัดการเซสชัน](/th/reference/session-management-compaction), [เซสชัน](/th/cli/sessions)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การจัดการโทเค็น</span>
          <span>3 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Compaction](/th/concepts/compaction), [บริบท](/th/concepts/context), [Compaction สำหรับการจัดการเซสชัน](/th/reference/session-management-compaction)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">กลไกบริบท</span>
          <span>2 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>57%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "57%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[บริบท](/th/concepts/context), [กลไกบริบท](/th/concepts/context-engine)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความสอดคล้องของประวัติและเซสชันระหว่างไคลเอนต์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[เว็บแชต](/th/web/webchat), [Android](/th/platforms/android), [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การวินิจฉัย การบำรุงรักษา และการกู้คืน</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การวินิจฉัย](/th/gateway/diagnostics), [Compaction สำหรับการจัดการเซสชัน](/th/reference/session-management-compaction), [แฟล็ก](/th/diagnostics/flags)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">พรอมต์หลักและบริบท</span>
          <span>2 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[บริบท](/th/concepts/context), [การรักษาความสะอาดของทรานสคริปต์](/th/reference/transcript-hygiene), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">หน่วยความจำ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การกำหนดค่าหน่วยความจำ](/th/reference/memory-config), [หน่วยความจำ Qmd](/th/concepts/memory-qmd), [หน่วยความจำ](/th/concepts/memory), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางเซสชัน</span>
          <span>2 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[เซสชัน](/th/concepts/session), [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การคงอยู่ของบทถอดความ</span>
          <span>2 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Compaction สำหรับการจัดการเซสชัน](/th/reference/session-management-compaction), [สุขอนามัยของบทถอดความ](/th/reference/transcript-hygiene)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เฟรมเวิร์กช่องทาง - M3 เบตา - 8 ด้าน">
    <a id="channel-framework" />

    ช่องทางจำนวนมากใช้สัญญาการนำส่งและการกำหนดเส้นทางของ Gateway ร่วมกัน แต่ลักษณะการทำงานของแต่ละช่องทางแตกต่างกันตามข้อจำกัดของ API ต้นทางและนโยบายบัญชี

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระยะทดลอง - 13%</span><span>คุณภาพ เบตา - 76%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">คำสั่งการดำเนินการของช่องทางและการอนุมัติ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[กลุ่ม](/th/channels/groups), [Discord](/th/channels/discord), [Googlechat](/th/channels/googlechat), [Signal](/th/channels/signal), [Matrix](/th/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าช่องทาง</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/channels/index), [การจับคู่](/th/channels/pairing), [การแก้ไขปัญหา](/th/channels/troubleshooting), [Plugin ช่องทางสำหรับ SDK](/th/plugins/sdk-channel-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ลักษณะการทำงานของเธรดกลุ่มและห้องแวดล้อม</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>36%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "36%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[กลุ่ม](/th/channels/groups), [ข้อความกลุ่ม](/th/channels/group-messages), [เหตุการณ์ของห้องแวดล้อม](/th/channels/ambient-room-events), [กลุ่มกระจายข้อความ](/th/channels/broadcast-groups), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ด่านควบคุมการเข้าถึงขาเข้าและข้อมูลประจำตัว</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[กลุ่มการเข้าถึง](/th/channels/access-groups), [กลุ่ม](/th/channels/groups), [Discord](/th/channels/discord), [LINE](/th/channels/line)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ไฟล์แนบสื่อและข้อมูลช่องทางแบบสมบูรณ์</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[LINE](/th/channels/line), [Signal](/th/channels/signal), [Googlechat](/th/channels/googlechat), [Matrix](/th/channels/matrix), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">กระบวนการส่งออกและตอบกลับ</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[กลุ่ม](/th/channels/groups), [เหตุการณ์ของห้องแวดล้อม](/th/channels/ambient-room-events), [Discord](/th/channels/discord), [Matrix](/th/channels/matrix), [การกำหนดค่าช่องทาง](/th/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>10 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing), [กลุ่ม](/th/channels/groups), [Discord](/th/channels/discord), [Matrix](/th/channels/matrix), [การแก้ไขปัญหา](/th/channels/troubleshooting), [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สถานะ ความพร้อมใช้งาน และการควบคุมสำหรับผู้ปฏิบัติงาน</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[สถานะระบบ](/th/gateway/health), [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [การแก้ไขปัญหา](/th/channels/troubleshooting), [Discord](/th/channels/discord)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ความสามารถในการสังเกตการณ์ - M3 เบต้า - 5 ด้าน">
    <a id="observability" />

    มีเอกสารเกี่ยวกับ OTel, Prometheus, การบันทึกล็อก และการวินิจฉัยแล้ว แต่ยังต้องปรับปรุงให้สมบูรณ์ขึ้นสำหรับเผยแพร่สู่สาธารณะ โดยอธิบายว่า “ผู้ดูแลระบบควรตรวจสอบสิ่งใดก่อน”

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 18%</span><span>คุณภาพ ระดับเบตา - 75%</span><span>ความสมบูรณ์ ระดับเบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สถานะระบบและการซ่อมแซม</span>
          <span>12 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>28%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "28%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[สถานะระบบ](/th/gateway/health), [Telegram](/th/channels/telegram), [เครื่องมือตรวจและซ่อมแซม](/th/cli/doctor), [เครื่องมือตรวจและซ่อมแซม](/th/gateway/doctor), [เส้นทางย่อยของ SDK](/th/plugins/sdk-subpaths), [สถานะระบบ](/th/cli/health), [โพรโทคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การบันทึกล็อก</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การบันทึกล็อก](/th/logging), [การบันทึกล็อก](/th/gateway/logging), [ล็อก](/th/cli/logs)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การรวบรวมข้อมูลวินิจฉัย</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การวินิจฉัย](/th/gateway/diagnostics), [สถานะระบบ](/th/gateway/health), [ชุดทดสอบ Codex](/th/plugins/codex-harness), [โพรโทคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การส่งออกข้อมูลโทรมาตร</span>
          <span>13 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ฮุก](/th/plugins/hooks), [OpenTelemetry](/th/gateway/opentelemetry), [การบันทึกล็อก](/th/logging), [เส้นทางย่อยของ SDK](/th/plugins/sdk-subpaths), [การวินิจฉัยด้วย OTEL](/th/plugins/reference/diagnostics-otel), [Prometheus](/th/gateway/prometheus), [การวินิจฉัยด้วย Prometheus](/th/plugins/reference/diagnostics-prometheus)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การวินิจฉัยเซสชัน</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenTelemetry](/th/gateway/opentelemetry), [Prometheus](/th/gateway/prometheus), [การวินิจฉัย](/th/gateway/diagnostics), [โพรโทคอล](/th/gateway/protocol)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เว็บแอป Gateway - M3 เบตา - 6 ด้าน">
    <a id="gateway-web-app" />

    มีเอกสาร Web UI ครอบคลุมขั้นตอนการจับคู่ แชต PWA การสนทนาด้วยเสียง การแจ้งเตือนแบบพุช และการใช้งาน Gateway จากระยะไกล เลื่อนระดับหลังจากมีตารางประเมินสำหรับการใช้งานข้ามเบราว์เซอร์และ PWA บนอุปกรณ์เคลื่อนที่

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 4%</span><span>คุณภาพ ระดับเบตา - 74%</span><span>ความสมบูรณ์ ระดับเบตา - 79%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสนทนาแบบเรียลไทม์ผ่านเบราว์เซอร์</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[UI ควบคุม](/th/web/control-ui), [โปรโตคอล](/th/gateway/protocol), [การสนทนา](/th/nodes/talk)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและความไว้วางใจผ่านเบราว์เซอร์</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[UI ควบคุม](/th/web/control-ui), [แดชบอร์ด](/th/web/dashboard), [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดค่า</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[UI ควบคุม](/th/web/control-ui), [การกำหนดค่า](/th/gateway/configuration)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ส่วนติดต่อผู้ใช้บนเบราว์เซอร์</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[UI ควบคุม](/th/web/control-ui), [ดัชนี](/th/web/index), [แดชบอร์ด](/th/web/dashboard), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสนทนาใน WebChat</span>
          <span>15 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>10%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "10%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[UI ควบคุม](/th/web/control-ui), [เว็บแชต](/th/web/webchat), [เริ่มต้นใช้งาน](/th/start/getting-started), [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing), [การดำเนินการกับไฟล์อย่างปลอดภัย](/th/gateway/security/secure-file-operations)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">คอนโซลผู้ดูแลระบบ</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[UI ควบคุม](/th/web/control-ui), [สถานะระบบ](/th/gateway/health), [โปรโตคอล](/th/gateway/protocol), [แดชบอร์ด](/th/web/dashboard)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Plugin - M3 เบตา - 9 ด้าน">
    <a id="plugins" />

    มีเอกสารที่ครอบคลุมและหลักฐานรันไทม์ภายในที่ชัดเจนสำหรับไฟล์ manifest การค้นหา การโหลด สถาปัตยกรรมผู้ให้บริการและเครื่องมือ ตลอดจนขอบเขตการอนุมัติ คงระดับแถวนี้ไว้ที่เบตาจนกว่าจะมีหลักฐานที่ชัดเจนยิ่งขึ้นเกี่ยวกับ API/เส้นทางย่อยของ SDK สาธารณะและการเผยแพร่ภายนอก

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ทดลอง - 12%</span><span>คุณภาพ เบตา - 72%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 7</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสร้างและจัดแพ็กเกจ Plugin</span>
          <span>8 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสร้าง Plugin](/th/plugins/building-plugins), [ภาพรวม SDK](/th/plugins/sdk-overview), [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints), [พาธย่อยของ SDK](/th/plugins/sdk-subpaths), [ไฟล์ Manifest](/th/plugins/manifest), [เอกสารอ้างอิง](/th/plugins/reference)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin ที่รวมมาให้</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[รายการ Plugin](/th/plugins/plugin-inventory), [Plugin](/th/cli/plugins), [รายละเอียดภายในของสถาปัตยกรรม](/th/plugins/architecture-internals)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin Canvas</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Canvas](/th/plugins/reference/canvas), [Canvas](/th/refactor/canvas), [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การติดตั้งและเรียกใช้ Plugin</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>35%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "35%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[สถาปัตยกรรม](/th/plugins/architecture), [รายละเอียดภายในของสถาปัตยกรรม](/th/plugins/architecture-internals), [Plugin](/th/cli/plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin ช่องทาง</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin ช่องทางของ SDK](/th/plugins/sdk-channel-plugins), [ข้อมูลขาเข้าของช่องทางใน SDK](/th/plugins/sdk-channel-inbound), [ข้อมูลขาออกของช่องทางใน SDK](/th/plugins/sdk-channel-outbound)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin ผู้ให้บริการและเครื่องมือ</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>43%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "43%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin ผู้ให้บริการของ SDK](/th/plugins/sdk-provider-plugins), [Plugin เครื่องมือ](/th/plugins/tool-plugins), [การเพิ่มความสามารถ](/th/plugins/adding-capabilities)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การอนุมัติ Plugin</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests), [การอนุมัติการดำเนินการ](/th/tools/exec-approvals), [Plugin ช่องทางของ SDK](/th/plugins/sdk-channel-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเผยแพร่ Plugin</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin](/th/cli/plugins), [ความเข้ากันได้](/th/plugins/compatibility), [การเผยแพร่](/th/clawhub/publishing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การทดสอบ Plugin</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>27%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "27%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การทดสอบ SDK](/th/plugins/sdk-testing), [การตั้งค่า SDK](/th/plugins/sdk-setup), [ชุดทดสอบ Codex](/th/plugins/codex-harness)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ความปลอดภัย การยืนยันตัวตน การจับคู่ และข้อมูลลับ - M3 เบตา - 6 ด้าน">
    <a id="security-auth-pairing-and-secrets" />

    มีเอกสารและกลไกเสริมความแข็งแกร่งที่ดี ควรเลื่อนระดับหลังจากการทดสอบสถานการณ์อัปเกรดและความปลอดภัยเป็นประจำพิสูจน์แล้วว่าไม่มีการถดถอยในการตั้งค่า

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระยะทดลอง - 16%</span><span>คุณภาพ เบตา - 72%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">นโยบายการอนุมัติและมาตรการป้องกันสำหรับเครื่องมือ</span>
          <span>2 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การอนุมัติการดำเนินการ](/th/tools/exec-approvals), [การอนุมัติ](/th/cli/approvals), [คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests), [การตรวจสอบการตรวจประเมิน](/th/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การยืนยันตัวตนของ Gateway และการเข้าถึงจากระยะไกล</span>
          <span>9 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/security/index), [คู่มือรับมือการเปิดเผย](/th/gateway/security/exposure-runbook), [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth), [Tailscale](/th/gateway/tailscale), [ระยะไกล](/th/gateway/remote), [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [Gateway](/th/cli/gateway), [การวินิจฉัย](/th/cli/doctor), [ส่วนติดต่อผู้ใช้สำหรับควบคุม](/th/web/control-ui), [การควบคุมเบราว์เซอร์](/th/tools/browser-control), [การตรวจสอบการตรวจประเมิน](/th/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมการเข้าถึงช่องทาง</span>
          <span>3 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การจับคู่](/th/channels/pairing), [Telegram](/th/channels/telegram), [กลุ่มการเข้าถึง](/th/channels/access-groups), [การตรวจสอบการตรวจประเมิน](/th/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การจับคู่อุปกรณ์และ Node</span>
          <span>11 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[โพรโทคอล](/th/gateway/protocol), [อุปกรณ์](/th/cli/devices), [การจับคู่](/th/channels/pairing), [การจับคู่](/th/gateway/pairing), [ขอบเขตสิทธิ์ของผู้ปฏิบัติการ](/th/gateway/operator-scopes), [ส่วนติดต่อผู้ใช้สำหรับควบคุม](/th/web/control-ui), [เว็บแชต](/th/web/webchat), [การอนุมัติ](/th/cli/approvals)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความน่าเชื่อถือของ Plugin</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ไฟล์กำกับ](/th/plugins/manifest), [คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests), [จัดการ Plugin](/th/plugins/manage-plugins), [การตรวจสอบการตรวจประเมิน](/th/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สุขอนามัยของข้อมูลประจำตัวและข้อมูลลับ</span>
          <span>5 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระยะทดลอง</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การยืนยันตัวตน](/th/gateway/authentication), [โมเดล](/th/cli/models), [OpenAI](/th/providers/openai), [OAuth](/th/concepts/oauth), [ข้อมูลลับ](/th/gateway/secrets), [ข้อมูลลับ](/th/cli/secrets), [พื้นผิวข้อมูลประจำตัว Secretref](/th/reference/secretref-credential-surface), [การตรวจสอบการตรวจประเมิน](/th/gateway/security/audit-checks)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ: Cron, ฮุก, งาน, การสำรวจเป็นระยะ - M3 เบตา - 6 ด้าน">
    <a id="automation-cron-hooks-tasks-polling" />

    มีเอกสารและพร้อมใช้งาน แต่การพิสูจน์ด้วยสถานการณ์ควรครอบคลุมการส่งมอบแบบไม่มีผู้ดูแล การลองใหม่ และการมองเห็นความล้มเหลว

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระยะทดลอง - 2%</span><span>คุณภาพ เบตา - 72%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>พื้นที่</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">งาน Cron</span>
          <span>15 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[งาน Cron](/th/automation/cron-jobs), [Cron](/th/cli/cron), [โปรโตคอล](/th/gateway/protocol), [งาน](/th/automation/tasks), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การรับเข้าเหตุการณ์</span>
          <span>15 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/th/channels/telegram), [Zalo](/th/channels/zalo), [การแก้ไขปัญหา](/th/channels/troubleshooting), [iMessage จาก BlueBubbles](/th/channels/imessage-from-bluebubbles), [การผสานรวม Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration), [Gmail Pub/Sub](/th/automation/cron-jobs), [Webhooks](/th/cli/webhooks), [Webhooks](/th/automation/cron-jobs#webhooks), [Webhook](/th/automation/cron-jobs)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ฮุกระบบอัตโนมัติ</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ฮุก](/th/automation/hooks), [ฮุก](/th/cli/hooks), [ฮุก](/th/plugins/hooks), [คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests), [พาธย่อยของ SDK](/th/plugins/sdk-subpaths)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">งานและโฟลว์เบื้องหลัง</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[งาน](/th/automation/tasks), [ดัชนี](/th/automation/index), [งาน](/th/cli/tasks), [TaskFlow](/th/automation/taskflow), [รันไทม์ของ SDK](/th/plugins/sdk-runtime)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Heartbeat</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/automation/index), [Heartbeat](/th/gateway/heartbeat), [ข้อผูกพัน](/th/concepts/commitments)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมการสำรวจเป็นระยะ</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสำรวจ](/th/cli/message), [ข้อความ](/th/cli/message), [Telegram](/th/channels/telegram), [Microsoft Teams](/th/channels/msteams), [กระบวนการเบื้องหลัง](/th/gateway/background-process)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="การทำความเข้าใจและการสร้างสื่อ - M2 แอลฟา - 6 พื้นที่">
    <a id="media-understanding-and-media-generation" />

    มีขอบเขตความสามารถที่หลากหลาย แต่ความแตกต่างระหว่างผู้ให้บริการ ขีดจำกัดของไฟล์ และความเท่าเทียมกันระหว่าง Node กับแอป ทำให้ยังไม่เสถียร

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 2%</span><span>คุณภาพ ระดับแอลฟา - 64%</span><span>ความสมบูรณ์ ระดับแอลฟา - 68%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การรับและเข้าถึงสื่อ</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ภาพรวมสื่อ](/th/tools/media-overview), [การทำความเข้าใจสื่อ](/th/nodes/media-understanding), [การดำเนินการกับไฟล์อย่างปลอดภัย](/th/gateway/security/secure-file-operations), [PDF](/th/tools/pdf), [การสร้างรูปภาพ](/th/tools/image-generation), [QR](/th/cli/qr), [LINE](/th/channels/line), [WhatsApp](/th/channels/whatsapp)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การจัดการสื่อของช่องทาง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[รูปภาพ](/th/nodes/images), [ภาพรวมสื่อ](/th/tools/media-overview), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดค่าสื่อ</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ภาพรวมสื่อ](/th/tools/media-overview), [การสร้างรูปภาพ](/th/tools/image-generation), [ไฟล์กำกับ](/th/plugins/manifest), [ชุดควบคุม Codex](/th/plugins/codex-harness)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การส่งมอบเสียงสังเคราะห์จากข้อความ</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสังเคราะห์เสียงจากข้อความ](/th/tools/tts), [ภาพรวมสื่อ](/th/tools/media-overview), [Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การทำความเข้าใจสื่อ</span>
          <span>12 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">[เสียง](/th/nodes/audio), [การทำความเข้าใจสื่อ](/th/nodes/media-understanding), [ภาพรวมสื่อ](/th/tools/media-overview), [WhatsApp](/th/channels/whatsapp), [รูปภาพ](/th/nodes/images), [การอนุมาน](/th/cli/infer), [PDF](/th/tools/pdf)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสร้างสื่อ</span>
          <span>17 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>5%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "5%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสร้างรูปภาพ](/th/tools/image-generation), [ภาพรวมสื่อ](/th/tools/media-overview), [Skills](/th/tools/skills), [การสร้างเพลง](/th/tools/music-generation), [การสร้างวิดีโอ](/th/tools/video-generation)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เสียงพูดและการสนทนาแบบเรียลไทม์ - M2 อัลฟา - 6 ขอบเขต">
    <a id="voice-and-realtime-talk" />

    มีการใช้งานหลายรูปแบบใน Control UI, แอป และผู้ให้บริการ จำเป็นต้องมีตารางประเมินเวลาแฝง รูปแบบความล้มเหลว และการตั้งค่า ก่อนเข้าสู่ระยะเบตา

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ อัลฟา - 61%</span><span>ความสมบูรณ์ อัลฟา - 68%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ผู้ให้บริการการสนทนา</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenAI](/th/providers/openai), [Google](/th/providers/google), [Plugin ผู้ให้บริการ SDK](/th/plugins/sdk-provider-plugins), [การสนทนา](/th/nodes/talk), [UI ควบคุม](/th/web/control-ui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เซสชันการสนทนาแบบเรียลไทม์</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสนทนา](/th/nodes/talk), [UI ควบคุม](/th/web/control-ui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เสียงพูดและการถอดเสียง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสนทนา](/th/nodes/talk), [OpenAI](/th/providers/openai), [Google](/th/providers/google)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสนทนาในแอปเนทีฟ</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสนทนา](/th/nodes/talk), [การปลุกด้วยเสียง](/th/platforms/mac/voicewake)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การปลุกด้วยเสียงและการกำหนดเส้นทาง</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การปลุกด้วยเสียง](/th/nodes/voicewake), [การปลุกด้วยเสียง](/th/platforms/mac/voicewake), [โอเวอร์เลย์เสียง](/th/platforms/mac/voice-overlay)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความสามารถในการสังเกตการณ์การสนทนา</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[UI ควบคุม](/th/web/control-ui), [โอเวอร์เลย์เสียง](/th/platforms/mac/voice-overlay), [การสนทนา](/th/nodes/talk)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="TUI - M2 อัลฟา - 5 ขอบเขต">
    <a id="tui" />

    มีอยู่ในเอกสารและซอร์สโค้ด แต่ปรากฏให้เห็นน้อยกว่าในฐานะเวิร์กโฟลว์หลักของผู้ใช้ จำเป็นต้องกำหนดสถานการณ์การใช้งานอย่างชัดเจน

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับอัลฟา - 59%</span><span>ความสมบูรณ์ ระดับอัลฟา - 66%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">โหมดรันไทม์</span>
          <span>14 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/th/cli/tui), [TUI](/th/web/tui), [ดัชนี](/th/cli/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">อินพุตและคำสั่ง</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/th/web/tui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การจัดการเซสชัน</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/th/web/tui), [เซสชัน](/th/cli/sessions)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเรียกใช้เชลล์ภายในเครื่อง</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/th/web/tui), [TUI](/th/cli/tui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเรนเดอร์และความปลอดภัยของเอาต์พุต</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/th/web/tui), [คิวอาร์](/th/cli/qr), [บันทึก](/th/cli/logs), [การเติมคำอัตโนมัติ](/th/cli/completion)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ClawHub - M2 อัลฟา - 4 ด้าน">
    <a id="clawhub" />

    มีเอกสารสาธารณะและแนวคิดด้านระบบนิเวศแล้ว แต่ยังต้องมีตารางคะแนนสำหรับการติดตั้ง ความน่าเชื่อถือ การอัปเดต การย้อนกลับ และความเข้ากันได้

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ อัลฟา - 58%</span><span>ความสมบูรณ์ อัลฟา - 62%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเผยแพร่</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">[การเผยแพร่](/th/clawhub/publishing), [การสร้าง Skills](/th/tools/creating-skills), [ชุมชน](/th/plugins/community)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การค้นพบแค็ตตาล็อก</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin](/th/tools/plugin), [Plugin](/th/cli/plugins), [Skills](/th/cli/skills), [Skills](/th/tools/skills), [ชุมชน](/th/plugins/community)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความเข้ากันได้และความน่าเชื่อถือ</span>
          <span>12 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin](/th/tools/plugin), [Plugin](/th/cli/plugins), [ความเข้ากันได้](/th/plugins/compatibility), [บัญชีรายการ Plugin](/th/plugins/plugin-inventory), [การเผยแพร่](/th/clawhub/publishing), [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">วงจรชีวิตและสถานะความสมบูรณ์ของ Plugin</span>
          <span>26 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin](/th/tools/plugin), [Plugin](/th/cli/plugins), [Skills](/th/cli/skills), [Skills](/th/tools/skills), [โพรโทคอล](/th/gateway/protocol), [ชุดรวม](/th/plugins/bundles), [การแก้ไขการขึ้นต่อกัน](/th/plugins/dependency-resolution)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="OpenClaw App SDK - M2 แอลฟา - 6 ด้าน">
    <a id="openclaw-app-sdk" />

    OpenClaw App SDK เป็นสัญญาสำหรับแอปภายนอกที่แยกต่างหากจากรันไทม์ Gateway และ Plugin SDK คะแนนปัจจุบันแสดงให้เห็นว่ามีเส้นทาง `@openclaw/sdk` ที่ใช้งานได้จริง แต่ยังมีช่องว่างเกี่ยวกับการจัดแพ็กเกจแบบสาธารณะ การค้นพบอัตโนมัติ การอนุมัติ ตัวช่วย และความเข้ากันได้

    <div className="maturity-surface-rollup"><span>ความครอบคลุมระดับทดลอง - 3%</span><span>คุณภาพระดับแอลฟา - 54%</span><span>ความสมบูรณ์ระดับแอลฟา - 53%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API ไคลเอนต์</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>51%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "51%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenClaw SDK](/th/gateway/external-apps), [การออกแบบ API ของ OpenClaw SDK](/th/gateway/external-apps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึง Gateway</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenClaw SDK](/th/gateway/external-apps), [การออกแบบ API ของ OpenClaw SDK](/th/gateway/external-apps), [โปรโตคอล](/th/gateway/protocol), [ดัชนี](/th/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสนทนาของเอเจนต์</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenClaw SDK](/th/gateway/external-apps), [การออกแบบ API ของ OpenClaw SDK](/th/gateway/external-apps), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เหตุการณ์และการอนุมัติ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenClaw SDK](/th/gateway/external-apps), [การออกแบบ API ของ OpenClaw SDK](/th/gateway/external-apps), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ตัวช่วยจัดการทรัพยากร</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenClaw SDK](/th/gateway/external-apps), [การออกแบบ API ของ OpenClaw SDK](/th/gateway/external-apps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความเข้ากันได้</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">[การออกแบบ API ของ OpenClaw SDK](/th/gateway/external-apps), [TypeBox](/th/concepts/typebox), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### แพลตฟอร์ม

<AccordionGroup>
  <Accordion title="โฮสต์ Gateway บน Linux - M4 เสถียร - 5 ขอบเขต">
    <a id="linux-gateway-host" />

    แนะนำให้ใช้รันไทม์ Node มีเอกสารสำหรับบริการผู้ใช้ systemd และมีคำแนะนำเกี่ยวกับ VPS/คอนเทนเนอร์อย่างครอบคลุม

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ เบตา - 75%</span><span>ความสมบูรณ์ เสถียร - 89%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและอัปเดตโฮสต์</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลองใช้</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/install/index), [การอัปเดต](/th/install/updating), [Linux](/th/platforms/linux), [ดัชนี](/th/platforms/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รันไทม์ Gateway และการควบคุมบริการ</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลองใช้</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/index), [Gateway](/th/cli/gateway), [Linux](/th/platforms/linux), [VPS](/th/vps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงระยะไกลและความปลอดภัย</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลองใช้</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [คู่มือปฏิบัติการด้านการเปิดเผย](/th/gateway/security/exposure-runbook), [การยืนยันตัวตน](/th/gateway/authentication), [ข้อมูลลับ](/th/gateway/secrets)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การวินิจฉัยและการซ่อมแซม</span>
          <span>4 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลองใช้</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[สถานะ](/th/cli/status), [บันทึก](/th/cli/logs), [การตรวจสอบและซ่อมแซม](/th/cli/doctor), [การวินิจฉัย](/th/gateway/diagnostics), [ดัชนี](/th/gateway/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เป้าหมายการปรับใช้</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลองใช้</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[VPS](/th/vps), [Docker](/th/install/docker), [Hetzner](/th/install/hetzner), [DigitalOcean](/th/install/digitalocean), [Kubernetes](/th/install/kubernetes), [Podman](/th/install/podman)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="โฮสต์ Gateway บน macOS - M4 เสถียร - 7 ขอบเขต">
    <a id="macos-gateway-host" />

    มีเอกสารสำหรับเส้นทางบริการ LaunchAgent, โหมด Gateway ภายในเครื่อง/ระยะไกล, การติดตั้ง CLI และการผสานรวมกับแอป

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลองใช้ - 0%</span><span>คุณภาพ ระดับเบตา - 74%</span><span>ความสมบูรณ์ ระดับเสถียร - 88%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>พื้นที่</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่า CLI</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[macOS](/th/platforms/macos), [Gateway ที่รวมมาให้](/th/platforms/mac/bundled-gateway), [ตัวติดตั้ง](/th/install/installer), [Node](/th/install/node)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การผสานรวม Gateway ภายในเครื่อง</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[macOS](/th/platforms/macos), [Gateway ที่รวมมาให้](/th/platforms/mac/bundled-gateway), [ระยะไกล](/th/platforms/mac/remote), [ดัชนี](/th/gateway/index), [Gateway](/th/cli/gateway), [Bonjour](/th/gateway/bonjour)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">โหมด Gateway ระยะไกล</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[ระยะไกล](/th/platforms/mac/remote), [ระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">วงจรชีวิตบริการ Gateway</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[macOS](/th/platforms/macos), [Gateway ที่รวมมาให้](/th/platforms/mac/bundled-gateway), [Gateway](/th/cli/gateway), [ดัชนี](/th/gateway/index), [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating), [ถอนการติดตั้ง](/th/install/uninstall), [การแก้ไขปัญหา](/th/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การวินิจฉัยและความสามารถในการสังเกตการณ์</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[Gateway ที่รวมมาให้](/th/platforms/mac/bundled-gateway), [macOS](/th/platforms/macos), [Gateway](/th/cli/gateway), [การวินิจฉัย](/th/gateway/doctor), [การแก้ไขปัญหา](/th/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สิทธิ์และความสามารถแบบเนทีฟ</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[macOS](/th/platforms/macos), [ระยะไกล](/th/platforms/mac/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">โปรไฟล์และการแยกส่วน</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบต้า</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[Gateway หลายรายการ](/th/gateway/multiple-gateways), [ดัชนี](/th/gateway/index), [Gateway](/th/cli/gateway)</div>
      </div>
    </div>

  </Accordion>
  <Accordion title="Android app - M4 Stable - 7 areas">
    <a id="android-app" />

    มีการเผยแพร่อย่างเป็นทางการผ่าน Google Play เอกสารสำหรับสร้างและเรียกใช้จากซอร์สโค้ดได้รับการดูแลอย่างต่อเนื่อง และแอป Android ได้รับการจัดทำเอกสารในฐานะ Node คู่หูตามปกติสำหรับผู้ใช้

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ เสถียร - 80%</span><span>ความสมบูรณ์ เสถียร - 80%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การบันทึกสื่อ</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/th/platforms/android), [กล้อง](/th/nodes/camera)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">แชตบนอุปกรณ์เคลื่อนที่</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/th/platforms/android)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าการเชื่อมต่อ</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/th/platforms/android), [Bonjour](/th/gateway/bonjour), [การจับคู่](/th/gateway/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเผยแพร่</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/th/platforms/android)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่า</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/th/platforms/android)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เสียง</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/th/platforms/android), [การสนทนา](/th/nodes/talk)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รันไทม์ของอุปกรณ์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/th/platforms/android), [การแก้ไขปัญหา](/th/nodes/troubleshooting), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
    </div>

  </Accordion>
  <Accordion title="แอป iOS - M4 เสถียร - 8 ด้าน">
    <a id="ios-app" />

    มีการเผยแพร่อย่างเป็นทางการผ่าน App Store มีเอกสารอธิบายการแจ้งเตือนแบบพุชที่รองรับด้วยรีเลย์ และแอป iOS ได้รับการจัดทำเอกสารให้เป็น Node คู่หูตามปกติสำหรับผู้ใช้

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ทดลอง - 0%</span><span>คุณภาพ เสถียร - 80%</span><span>ความสมบูรณ์ เสถียร - 80%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและการแชร์</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios), [กล้อง](/th/nodes/camera)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Canvas และหน้าจอ</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios), [Canvas](/th/plugins/reference/canvas)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">แชตและเซสชัน</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios), [เว็บแชต](/th/web/webchat), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการวินิจฉัย Gateway</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios), [การจับคู่](/th/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเผยแพร่</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">คำสั่งอุปกรณ์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การแจ้งเตือนและการทำงานเบื้องหลัง</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios), [การกำหนดค่า](/th/gateway/configuration)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เสียง</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios), [การพูด](/th/nodes/talk)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="การโฮสต์ด้วย Docker และ Podman - M3 เบตา - 4 ด้าน">
    <a id="docker-and-podman-hosting" />

    มีเอกสารการติดตั้งและเป็นแนวทางการปรับใช้ที่ใช้กันทั่วไป เลื่อนระดับเมื่อการทดสอบควันประจำรุ่นครอบคลุมพฤติกรรมการอัปเกรดและวอลุ่มอย่างต่อเนื่อง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ทดลอง - 7%</span><span>คุณภาพ เบตา - 71%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าคอนเทนเนอร์</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Docker](/th/install/docker), [Podman](/th/install/podman)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การดำเนินงานคอนเทนเนอร์</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Podman](/th/install/podman), [รันไทม์ Docker VM](/th/install/docker-vm-runtime), [Docker](/th/install/docker), [Hetzner](/th/install/hetzner), [Hostinger](/th/install/hostinger)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเผยแพร่และการตรวจสอบอิมเมจ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Docker](/th/install/docker), [รันไทม์ Docker VM](/th/install/docker-vm-runtime), [การตรวจสอบการเผยแพร่แบบเต็มรูปแบบ](/th/reference/full-release-validation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">แซนด์บ็อกซ์และเครื่องมือสำหรับเอเจนต์</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Docker](/th/install/docker), [รันไทม์ Docker VM](/th/install/docker-vm-runtime)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Windows ผ่าน WSL2 - M3 เบตา - 6 ด้าน">
    <a id="windows-via-wsl2" />

    แนวทางที่แนะนำสำหรับ Windows พร้อมคำแนะนำเกี่ยวกับ systemd/บริการผู้ใช้และเอกสารลำดับการบูต เลื่อนระดับหลังจากประเมินคะแนนการติดตั้ง/อัปเดตซ้ำหลายครั้ง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 6%</span><span>คุณภาพ ระดับแอลฟา - 69%</span><span>ความสมบูรณ์ ระดับเบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่า WSL</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [เริ่มต้นใช้งาน](/th/start/getting-started)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>8 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating), [การเริ่มตั้งค่า](/th/cli/onboard), [การวินิจฉัย](/th/cli/doctor), [สถานะ](/th/cli/status), [บันทึก](/th/cli/logs)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">วงจรชีวิตบริการ Gateway</span>
          <span>10 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [ดัชนี](/th/gateway/index), [การวินิจฉัย](/th/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและการเปิดเผย Gateway</span>
          <span>11 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การยืนยันตัวตน](/th/gateway/authentication), [ข้อมูลลับ](/th/gateway/secrets), [ระยะไกล](/th/gateway/remote), [คู่มือปฏิบัติการการเปิดเผย](/th/gateway/security/exposure-runbook), [Windows](/th/platforms/windows)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การวินิจฉัยและการซ่อมแซม</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [สถานะ](/th/cli/status), [บันทึก](/th/cli/logs), [การวินิจฉัย](/th/cli/doctor), [การวินิจฉัย](/th/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เบราว์เซอร์และ UI ควบคุม</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การแก้ไขปัญหา CDP ระยะไกลของเบราว์เซอร์บน WSL2 Windows](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting), [เบราว์เซอร์](/th/tools/browser), [UI ควบคุม](/th/web/control-ui)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Raspberry Pi และอุปกรณ์ Linux ขนาดเล็ก - M3 เบตา - 4 ด้าน">
    <a id="raspberry-pi-and-small-linux-devices" />

    มีเอกสารแพลตฟอร์มแล้ว และเส้นทาง Gateway ใช้ Linux เป็นพื้นฐาน จำเป็นต้องมีหลักฐานการทดสอบเบื้องต้นของรุ่นที่เจาะจงสำหรับฮาร์ดแวร์เพื่อเลื่อนไปยังระดับที่สูงขึ้น

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับแอลฟา - 67%</span><span>ความสมบูรณ์ ระดับเบตา - 79%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและความเข้ากันได้</span>
          <span>12 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Raspberry Pi](/th/install/raspberry-pi), [ดัชนี](/th/install/index), [คำถามที่พบบ่อยเกี่ยวกับการเรียกใช้ครั้งแรก](/th/help/faq-first-run), [คำถามที่พบบ่อย](/th/help/faq), [Linux](/th/platforms/linux), [ตัวติดตั้ง](/th/install/installer)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงระยะไกลและการยืนยันตัวตน</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Raspberry Pi](/th/install/raspberry-pi), [การยืนยันตัวตน](/th/gateway/authentication), [ข้อมูลลับ](/th/gateway/secrets), [การจับคู่](/th/gateway/pairing), [อุปกรณ์](/th/cli/devices), [ระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รันไทม์ Gateway</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/index), [Gateway](/th/cli/gateway), [Raspberry Pi](/th/install/raspberry-pi), [Linux](/th/platforms/linux), [VPS](/th/vps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ประสิทธิภาพและการวินิจฉัย</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Raspberry Pi](/th/install/raspberry-pi), [Linux](/th/platforms/linux), [สถานะการทำงาน](/th/gateway/health), [การวินิจฉัย](/th/gateway/diagnostics)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="แอปคู่หูสำหรับ macOS - M3 เบตา - 8 ด้าน">
    <a id="macos-companion-app" />

    มีแอปแถบเมนูที่มีฟังก์ชันครบครัน การอนุญาต โหมด Node, Canvas, การปลุกด้วยเสียง, WebChat และโหมดระยะไกลแล้ว แต่ยังเปลี่ยนแปลงอย่างรวดเร็วจึงยังไม่ควรจัดเป็นระดับเสถียร

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับอัลฟา - 66%</span><span>ความสมบูรณ์ ระดับเบตา - 78%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">แคนวาส</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[แคนวาส](/th/platforms/mac/canvas), [Macos](/th/platforms/macos), [เว็บแชต](/th/web/webchat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าภายในเครื่อง</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Gateway ที่รวมมาให้](/th/platforms/mac/bundled-gateway), [Macos](/th/platforms/macos), [โพรเซสลูก](/th/platforms/mac/child-process), [การตั้งค่าสำหรับการพัฒนา](/th/platforms/mac/dev-setup)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สถานะและการตั้งค่า</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[แถบเมนู](/th/platforms/mac/menu-bar), [ไอคอน](/th/platforms/mac/icon), [Macos](/th/platforms/macos), [สถานะระบบ](/th/platforms/mac/health), [การบันทึกล็อก](/th/platforms/mac/logging), [ระยะไกล](/th/platforms/mac/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความสามารถแบบเนทีฟ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Macos](/th/platforms/macos), [Xpc](/th/platforms/mac/xpc), [สิทธิ์](/th/platforms/mac/permissions), [การลงนาม](/th/platforms/mac/signing), [Peekaboo](/th/platforms/mac/peekaboo)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเชื่อมต่อระยะไกล</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[ระยะไกล](/th/platforms/mac/remote), [Macos](/th/platforms/macos), [ระยะไกล](/th/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เสียงและการสนทนา</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[การปลุกด้วยเสียง](/th/platforms/mac/voicewake), [โอเวอร์เลย์เสียง](/th/platforms/mac/voice-overlay), [การสนทนา](/th/nodes/talk), [Macos](/th/platforms/macos)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เว็บแชต</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[เว็บแชต](/th/platforms/mac/webchat), [Macos](/th/platforms/macos), [เว็บแชต](/th/web/webchat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เว็บแชตระยะไกล</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[เว็บแชต](/th/platforms/mac/webchat), [ระยะไกล](/th/gateway/remote), [ระยะไกล](/th/platforms/mac/remote)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Windows แบบเนทีฟ - M2 Alpha - 4 ด้าน">
    <a id="native-windows" />

    โฟลว์หลักของ CLI/Gateway ใช้งานได้ แต่เอกสารยังคงแนะนำ WSL2 เพื่อประสบการณ์การใช้งานที่ครบถ้วน และระบุข้อควรระวังสำหรับการใช้งานแบบเนทีฟ

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระยะทดลอง - 0%</span><span>คุณภาพ Alpha - 58%</span><span>ความสมบูรณ์ Alpha - 66%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 1</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>9 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/install/index), [ตัวติดตั้ง](/th/install/installer), [Windows](/th/platforms/windows), [เริ่มต้นใช้งาน](/th/start/getting-started), [การเริ่มตั้งค่า](/th/cli/onboard)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การจัดการ Gateway</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [ดัชนี](/th/gateway/index), [Gateway](/th/cli/gateway), [การวินิจฉัย](/th/cli/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เครือข่าย</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [ดัชนี](/th/gateway/index), [Gateway](/th/cli/gateway)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การอัปเดต</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[การอัปเดต](/th/install/updating), [CI](/th/ci)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="การโฮสต์บน Kubernetes - M2 อัลฟา - 4 ด้าน">
    <a id="kubernetes-hosting" />

    การโฮสต์บน Kubernetes เป็นแนวทางการปรับใช้คลัสเตอร์แบบเฉพาะที่ใช้ Kustomize คะแนนปัจจุบันแสดงให้เห็นว่ามีแนวทางการปรับใช้ขั้นต่ำที่ใช้งานได้จริง แต่ยังมีช่องว่างด้าน CI สำหรับ Kubernetes โดยเฉพาะ การจัดแพ็กเกจ ingress/TLS/NetworkPolicy การสำรองและกู้คืนข้อมูล และการเสริมความแข็งแกร่งด้านความปลอดภัยสำหรับการเปิดให้เข้าถึงในสภาพแวดล้อมใช้งานจริง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับแอลฟา - 55%</span><span>ความสมบูรณ์ ระดับแอลฟา - 61%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>พื้นที่</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าการปรับใช้</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/th/install/kubernetes), [ดัชนี](/th/install/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดค่าและข้อมูลลับ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/th/install/kubernetes), [ข้อมูลลับ](/th/gateway/secrets), [สภาพแวดล้อม](/th/help/environment)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและการเปิดให้เข้าถึง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/th/install/kubernetes), [การยืนยันตัวตน](/th/gateway/authentication), [ระยะไกล](/th/gateway/remote), [คู่มือปฏิบัติการสำหรับการเปิดให้เข้าถึง](/th/gateway/security/exposure-runbook)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">วงจรชีวิตของคลัสเตอร์</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/th/install/kubernetes), [ดัชนี](/th/gateway/index)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="พาธการติดตั้ง Nix - M1 รุ่นทดลอง - 5 พื้นที่">
    <a id="nix-install-path" />

    ขั้นตอนการติดตั้งเพิ่มเติม ต้องระบุคำมั่นด้านการสนับสนุนให้ชัดเจนยิ่งขึ้นก่อนเลื่อนสถานะเป็นอัลฟา/เบตา

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับทดลอง - 41%</span><span>ความสมบูรณ์ ระดับทดลอง - 44%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การส่งต่อหลังการติดตั้ง</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/th/install/nix), [ดัชนี](/th/install/index), [ไดเรกทอรีเอกสาร](/th/start/docs-directory)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">วงจรชีวิตของ Plugin</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[จัดการ Plugin](/th/plugins/manage-plugins), [Plugin](/th/tools/plugin), [Nix](/th/install/nix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเปิดใช้งานและประสบการณ์ผู้ใช้ของแอป</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/th/install/nix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดค่าและสถานะ</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/th/install/nix), [การตั้งค่า](/th/cli/setup), [สภาพแวดล้อม](/th/help/environment)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รันไทม์ของบริการและกลไกป้องกัน</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/th/install/nix), [การตั้งค่า](/th/cli/setup), [การวินิจฉัย](/th/cli/doctor), [การอัปเดต](/th/cli/update)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="พื้นผิวแอปคู่หู watchOS - M1 ระดับทดลอง - 5 ด้าน">
    <a id="watchos-companion-surfaces" />

    ซอร์สมีพื้นผิวของแอปและส่วนขยายสำหรับ Watch แต่เอกสารสาธารณะยังไม่ได้นำเสนอสิ่งนี้เป็นคุณลักษณะสำหรับผู้ใช้

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับทดลอง - 41%</span><span>ความสมบูรณ์ ระดับทดลอง - 44%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การส่งมอบและการกู้คืน</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การอนุมัติการดำเนินการ</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[การอนุมัติการดำเนินการ](/th/tools/exec-approvals), [iOS](/th/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเผยแพร่และการสนับสนุน</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การแจ้งเตือนและการตอบกลับ</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ส่วนติดต่อผู้ใช้ของแอป Watch</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/th/platforms/ios)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="แอปคู่หูสำหรับ Linux - M0 อยู่ในแผน - 5 ขอบเขต">
    <a id="linux-companion-app" />

    เอกสารระบุว่ามีแผนพัฒนาแอปคู่หูแบบเนทีฟสำหรับ Linux โดยปัจจุบัน Gateway เป็นแนวทางที่รองรับสำหรับ Linux

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับทดลอง - 19%</span><span>ความสมบูรณ์ ระดับทดลอง - 21%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเผยแพร่แอป</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/th/platforms/linux), [ดัชนี](/th/platforms/index), [ดัชนี](/th/install/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเชื่อมต่อ Gateway</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/th/platforms/linux), [ดัชนี](/th/gateway/index), [การจับคู่](/th/gateway/pairing), [ระยะไกล](/th/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การแชตและเซสชัน</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/th/platforms/linux), [โปรโตคอล](/th/gateway/protocol), [เว็บแชต](/th/web/webchat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความสามารถบนเดสก์ท็อป</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/th/platforms/linux), [การอนุมัติ Exec](/th/tools/exec-approvals), [ข้อมูลลับ](/th/gateway/secrets), [ดัชนี](/th/nodes/index), [Exec](/th/tools/exec), [พูดคุย](/th/nodes/talk), [กล้อง](/th/nodes/camera)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สถานะและการวินิจฉัย</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/th/platforms/linux), [OpenClaw](/th/start/openclaw), [การวินิจฉัย](/th/gateway/doctor)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="แอปคู่หูแบบเนทีฟสำหรับ Windows - M0 วางแผนแล้ว - 5 ด้าน">
    <a id="native-windows-companion-app" />

    อยู่ในขั้นวางแผนเท่านั้น

    <div className="maturity-surface-rollup"><span>ความครอบคลุมระดับทดลอง - 0%</span><span>คุณภาพระดับทดลอง - 19%</span><span>ความสมบูรณ์ระดับทดลอง - 21%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การติดตั้งและการอัปเดต</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [ดัชนี](/th/install/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเชื่อมต่อ Gateway</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [ดัชนี](/th/gateway/index), [การจับคู่](/th/gateway/pairing), [ระยะไกล](/th/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เซสชันแชต</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สถานะและการซ่อมแซม</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [การวินิจฉัย](/th/gateway/doctor), [ดัชนี](/th/gateway/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เครื่องมือเดสก์ท็อปและสิทธิ์</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/th/platforms/windows), [ดัชนี](/th/nodes/index), [การดำเนินการ](/th/tools/exec), [การอนุมัติการดำเนินการ](/th/tools/exec-approvals), [ดัชนี](/th/gateway/security/index)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### ช่องทาง

<AccordionGroup>
  <Accordion title="Discord - M4 เสถียร - 6 ด้าน">
    <a id="discord" />

    มีเอกสารเชิงลึกและครอบคลุมฟีเจอร์อย่างกว้างขวาง เส้นทางเสียงและการมอบหมายงานควรได้รับการให้คะแนนแยกกันในระดับเบตา/แอลฟา

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ทดลอง - 0%</span><span>คุณภาพ เบตา - 73%</span><span>ความสมบูรณ์ เสถียร - 87%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>10 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/th/channels/discord), [Discord](/th/plugins/reference/discord), [Fly](/th/install/fly), [คำสั่งแบบสแลช](/th/tools/slash-commands), [สถานะระบบ](/th/gateway/health), [ช่องทาง](/th/cli/channels), [การกำหนดค่าช่องทาง](/th/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>6 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/th/channels/discord), [การจับคู่](/th/channels/pairing), [กลุ่มการเข้าถึง](/th/channels/access-groups), [กลุ่ม](/th/channels/groups)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span>12 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/th/channels/discord), [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing), [กลุ่ม](/th/channels/groups), [กลุ่มการเข้าถึง](/th/channels/access-groups), [เอเจนต์ ACP](/th/tools/acp-agents), [เอเจนต์ย่อย](/th/tools/subagents)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>1 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/th/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/th/channels/discord), [คำสั่งแบบสแลช](/th/tools/slash-commands)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เสียงและการโทรแบบเรียลไทม์</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">เสถียร</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/th/channels/discord), [OpenAI](/th/providers/openai), [ElevenLabs](/th/providers/elevenlabs), [ระบบอัตโนมัติ QA E2E](/th/concepts/qa-e2e-automation), [การกำหนดค่าช่องทาง](/th/gateway/config-channels)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Telegram - M3 เบตา - 5 ขอบเขต">
    <a id="telegram" />

    ช่องทางหลักมีความพร้อมเพียงพอสำหรับการใช้งานทั่วไป แต่ประสบการณ์ผู้ใช้ที่มีความแปรปรวนสูงและกรณีขอบเขตด้านสื่อยังต้องมีการพิสูจน์ด้วยสถานการณ์ซ้ำอย่างต่อเนื่อง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ทดลอง - 0%</span><span>คุณภาพ แอลฟา - 68%</span><span>ความสมบูรณ์ เบตา - 78%</span><span><span className="maturity-lts maturity-lts-full">เต็มรูปแบบ - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>10 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/th/channels/telegram), [การกำหนดค่าช่องทาง](/th/gateway/config-channels), [ช่องทาง](/th/cli/channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>10 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/th/channels/telegram), [การจับคู่](/th/channels/pairing), [กลุ่มการเข้าถึง](/th/channels/access-groups), [กลุ่ม](/th/channels/groups), [หลายเอเจนต์](/th/concepts/multi-agent)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span>1 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/th/channels/telegram), [กลุ่ม](/th/channels/groups), [หลายเอเจนต์](/th/concepts/multi-agent)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>1 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/th/channels/telegram), [ตำแหน่งที่ตั้ง](/th/channels/location)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span>9 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/th/channels/telegram), [การอนุมัติการดำเนินการ](/th/tools/exec-approvals), [ปฏิกิริยา](/th/tools/reactions)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Slack - M3 เบตา - 5 ด้าน">
    <a id="slack" />

    เอกสารและพื้นผิวการกำหนดเส้นทางของช่องทางระดับเฟิร์สคลาส จำเป็นต้องมีตารางคะแนนสำหรับสถานการณ์การติดตั้งและการดูแลพื้นที่ทำงาน

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับอัลฟา - 66%</span><span>ความสมบูรณ์ ระดับเบตา - 78%</span><span><span className="maturity-lts maturity-lts-full">เต็มรูปแบบ - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>10 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/th/channels/slack), [Slack](/th/plugins/reference/slack), [ข้อมูลลับ](/th/gateway/secrets), [ระบบอัตโนมัติสำหรับการทดสอบ QA แบบครบวงจร](/th/concepts/qa-e2e-automation), [การแก้ไขปัญหา](/th/channels/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>1 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/th/channels/slack), [การจับคู่](/th/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>5 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/th/channels/slack), [การป้องกันลูปของบอต](/th/channels/bot-loop-protection), [การจับคู่](/th/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>1 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/th/channels/slack), [ระบบอัตโนมัติสำหรับการทดสอบ QA แบบครบวงจร](/th/concepts/qa-e2e-automation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span>8 ความสามารถ / รองรับระยะยาว</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/th/channels/slack), [คำสั่งแบบสแลช](/th/tools/slash-commands), [การอนุมัติการเรียกใช้คำสั่ง](/th/tools/exec-approvals)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="iMessage และ BlueBubbles - M3 เบตา - 5 ขอบเขต">
    <a id="imessage-and-bluebubbles" />

    iMessage ที่รองรับทำงานผ่าน imsg บนโฮสต์ macOS Messages ที่ลงชื่อเข้าใช้แล้ว ส่วนการกำหนดค่า BlueBubbles แบบเดิมจำเป็นต้องย้ายข้อมูล ควรแสดงข้อควรระวังเกี่ยวกับสิทธิ์ของ macOS, ตัวห่อหุ้ม SSH, SIP/API ส่วนตัว และการย้ายข้อมูลไว้อย่างชัดเจน

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับอัลฟา - 66%</span><span>ความสมบูรณ์ ระดับเบตา - 78%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>การครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[BlueBubbles iMessage](/th/announcements/bluebubbles-imessage), [iMessage จาก BlueBubbles](/th/channels/imessage-from-bluebubbles), [การกำหนดค่าช่องทาง](/th/gateway/config-channels), [iMessage](/th/channels/imessage)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[iMessage](/th/channels/imessage), [iMessage จาก BlueBubbles](/th/channels/imessage-from-bluebubbles), [การกำหนดค่าช่องทาง](/th/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[iMessage](/th/channels/imessage)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาที่หลากหลาย</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[iMessage](/th/channels/imessage), [iMessage จาก BlueBubbles](/th/channels/imessage-from-bluebubbles), [การกำหนดค่าช่องทาง](/th/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[iMessage](/th/channels/imessage)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="WhatsApp - M3 เบตา - 5 ขอบเขต">
    <a id="whatsapp" />

    เส้นทางหลักมีความสำคัญและมีเอกสารกำกับ แต่ความผันผวนของ Baileys/เซสชันต้นทางทำให้ยังไม่ถึงระดับเสถียร

    <div className="maturity-surface-rollup"><span>การครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ อัลฟา - 66%</span><span>ความสมบูรณ์ เบตา - 78%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/th/channels/whatsapp), [การกำหนดค่าช่องทาง](/th/gateway/config-channels), [WhatsApp](/th/plugins/reference/whatsapp), [ระบบอัตโนมัติ QA แบบ E2E](/th/concepts/qa-e2e-automation), [Doctor](/th/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและอัตลักษณ์</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/th/channels/whatsapp), [การกำหนดค่าช่องทาง](/th/gateway/config-channels), [ระบบอัตโนมัติ QA แบบ E2E](/th/concepts/qa-e2e-automation), [การจับคู่](/th/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/th/channels/whatsapp), [ข้อความกลุ่ม](/th/channels/group-messages)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/th/channels/whatsapp)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/th/channels/whatsapp)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เมทริกซ์ - M2 อัลฟา - 6 ด้าน">
    <a id="matrix" />

    รองรับผ่าน Plugin ที่รวมมาให้ ต้องมีบริดจ์ การยืนยันตัวตน และตารางประเมินวงจรชีวิตของห้อง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ อัลฟา - 60%</span><span>ความสมบูรณ์ อัลฟา - 67%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/th/channels/matrix), [การย้ายระบบ Matrix](/th/channels/matrix-migration)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/th/channels/matrix), [กลุ่ม](/th/channels/groups), [การป้องกันบอตวนซ้ำ](/th/channels/bot-loop-protection)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/th/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/th/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/th/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้ารหัสและการตรวจสอบยืนยัน</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/th/channels/matrix), [การย้ายระบบ Matrix](/th/channels/matrix-migration)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Google Chat - M2 แอลฟา - 5 ด้าน">
    <a id="google-chat" />

    ช่องทางมีเอกสารประกอบ แต่การตั้งค่าสำหรับองค์กรและผู้ดูแลระบบเพิ่มความเสี่ยงด้านระดับความพร้อมใช้งาน

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ แอลฟา - 59%</span><span>ความสมบูรณ์ แอลฟา - 66%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>16 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google Chat](/th/channels/googlechat), [Google Chat](/th/plugins/reference/googlechat), [การกำหนดค่าช่องทาง](/th/gateway/config-channels), [ข้อมูลอ้างอิง CLI ของตัวช่วยสร้าง](/th/start/wizard-cli-reference), [ข้อมูลลับ](/th/gateway/secrets), [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface), [สถานภาพ](/th/gateway/health), [รายการ Plugin](/th/plugins/plugin-inventory), [ดัชนี](/th/channels/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและอัตลักษณ์</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google Chat](/th/channels/googlechat), [การจับคู่](/th/channels/pairing), [กลุ่มการเข้าถึง](/th/channels/access-groups), [การกำหนดค่าช่องทาง](/th/gateway/config-channels), [การป้องกันลูปของบอต](/th/channels/bot-loop-protection), [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google Chat](/th/channels/googlechat), [การป้องกันลูปของบอต](/th/channels/bot-loop-protection), [กลุ่มการเข้าถึง](/th/channels/access-groups), [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google Chat](/th/channels/googlechat), [ข้อความ](/th/cli/message), [การทำความเข้าใจสื่อ](/th/nodes/media-understanding), [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมแบบเนทีฟและการอนุมัติ</span>
          <span>16 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google Chat](/th/channels/googlechat), [ข้อความ](/th/cli/message), [การทำความเข้าใจสื่อ](/th/nodes/media-understanding), [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface), [ปฏิกิริยา](/th/tools/reactions), [คำสั่งแบบสแลช](/th/tools/slash-commands), [การกำหนดค่าเอเจนต์](/th/gateway/config-agents), [การปรับโครงสร้างวงจรชีวิตข้อความ](/th/concepts/message-lifecycle-refactor)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Microsoft Teams - M2 แอลฟา - 5 ขอบเขต">
    <a id="microsoft-teams" />

    โฟลว์การยืนยันตัวตนและการดูแลระบบระดับองค์กรต้องมีหลักฐานจากสถานการณ์ที่ชัดเจน

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ แอลฟา - 59%</span><span>ความสมบูรณ์ แอลฟา - 66%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Microsoft Teams](/th/channels/msteams), [Microsoft Teams](/th/plugins/reference/msteams), [การกำหนดค่าช่องทาง](/th/gateway/config-channels), [สถานะระบบ](/th/gateway/health)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Microsoft Teams](/th/channels/msteams), [การจับคู่](/th/channels/pairing), [กลุ่มการเข้าถึง](/th/channels/access-groups)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Microsoft Teams](/th/channels/msteams), [กลุ่ม](/th/channels/groups), [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Microsoft Teams](/th/channels/msteams)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Microsoft Teams](/th/channels/msteams), [การอนุมัติการดำเนินการขั้นสูง](/th/tools/exec-approvals-advanced)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Signal - M2 แอลฟา - 5 ด้าน">
    <a id="signal" />

    มีเอกสารสำหรับช่องทางที่รองรับแล้ว แต่ยังต้องมีหลักฐานการติดตั้งและการเชื่อมต่อใหม่ที่ชัดเจนยิ่งขึ้น

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับแอลฟา - 59%</span><span>ความสมบูรณ์ ระดับแอลฟา - 66%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/th/channels/signal), [Signal](/th/plugins/reference/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/th/channels/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งการสนทนา</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/th/channels/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/th/channels/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การควบคุมและการอนุมัติแบบเนทีฟ</span>
          <span>3 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/th/channels/signal)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, ช่องทางระดับภูมิภาค - M2 แอลฟา - 4 ด้าน">
    <a id="feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels" />

    มีความครอบคลุมระดับภูมิภาคที่สำคัญ แต่ควรปรับระดับการรองรับสาธารณะให้เหมาะสมตามประเภทบัญชี การอนุมัติจากต้นทาง และหลักฐานจากผู้ดูแล

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ทดลอง - 0%</span><span>คุณภาพ แอลฟา - 55%</span><span>ความสมบูรณ์ แอลฟา - 58%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/channels/index), [การจับคู่](/th/channels/pairing), [Feishu](/th/plugins/reference/feishu), [สถาปัตยกรรมภายใน](/th/plugins/architecture-internals)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและข้อมูลประจำตัว</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">ไม่มีเอกสารที่เชื่อมโยง</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">ไม่มีเอกสารที่เชื่อมโยง</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">ไม่มีเอกสารที่เชื่อมโยง</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - M2 อัลฟา - 4 ด้าน">
    <a id="mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat" />

    มีพื้นผิวที่รองรับแล้ว แต่ระดับความพร้อมอาจแตกต่างกันไปตามความครอบคลุมของโครงการต้นทางและผู้ดูแล โปรดให้คะแนนแต่ละรายการแยกกันในภายหลัง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ อัลฟา - 53%</span><span>ความสมบูรณ์ อัลฟา - 54%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>พื้นที่</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">ไม่มีเอกสารที่เชื่อมโยง</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและอัตลักษณ์</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">ไม่มีเอกสารที่เชื่อมโยง</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งบทสนทนา</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">ไม่มีเอกสารที่เชื่อมโยง</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">ไม่มีเอกสารที่เชื่อมโยง</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ช่องทางการโทรด้วยเสียง - M1 ขั้นทดลอง - 5 พื้นที่">
    <a id="voice-call-channel" />

    เส้นทางเสริม/Plugin ที่มีลักษณะการทำงานแบบเรียลไทม์ซับซ้อน ต้องมีตารางประเมินสถานการณ์ก่อนเข้าสู่รุ่นเบต้าสาธารณะ

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ ขั้นทดลอง - 41%</span><span>ความสมบูรณ์ ขั้นทดลอง - 44%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการดำเนินงานของช่องทาง</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[การโทรด้วยเสียง](/th/cli/voicecall), [การโทรด้วยเสียง](/th/plugins/voice-call), [โปรโตคอล](/th/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเข้าถึงและอัตลักษณ์</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[การโทรด้วยเสียง](/th/plugins/voice-call), [การโทรด้วยเสียง](/th/cli/voicecall)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการส่งมอบการสนทนา</span>
          <span>1 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[การโทรด้วยเสียง](/th/plugins/voice-call)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อและเนื้อหาแบบสมบูรณ์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[การโทรด้วยเสียง](/th/plugins/voice-call), [รายการ Plugin](/th/plugins/plugin-inventory)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เสียงและการโทรแบบเรียลไทม์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[การโทรด้วยเสียง](/th/plugins/voice-call)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### ผู้ให้บริการและเครื่องมือ

<AccordionGroup>
  <Accordion title="เครื่องมือระบบอัตโนมัติของเบราว์เซอร์ การเรียกใช้คำสั่ง และแซนด์บ็อกซ์ - M3 เบตา - 3 ด้าน">
    <a id="browser-automation-exec-and-sandbox-tools" />

    เครื่องมือหลักมีเอกสารกำกับแล้ว แต่การรักษาความปลอดภัยของโฮสต์และประสบการณ์ผู้ใช้ด้านสิทธิ์ควรอยู่ภายใต้การทบทวนดัชนีชี้วัดอย่างต่อเนื่อง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 21%</span><span>คุณภาพ เบตา - 75%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 2</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ระบบอัตโนมัติสำหรับเบราว์เซอร์</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การควบคุมเบราว์เซอร์](/th/tools/browser-control), [การทดสอบ](/th/help/testing), [เบราว์เซอร์](/th/tools/browser), [ดัชนี](/th/gateway/security/index), [การตรวจสอบการตรวจประเมิน](/th/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเรียกใช้และการดำเนินการเครื่องมือ</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การดำเนินการ](/th/tools/exec), [กระบวนการเบื้องหลัง](/th/gateway/background-process), [HTTP API สำหรับเรียกใช้เครื่องมือ](/th/gateway/tools-invoke-http-api), [ขอบเขตสิทธิ์ของผู้ดำเนินการ](/th/gateway/operator-scopes), [โพรโทคอล](/th/gateway/protocol), [การอนุมัติการดำเนินการ](/th/tools/exec-approvals), [การอนุมัติการดำเนินการขั้นสูง](/th/tools/exec-approvals-advanced), [สิทธิ์ระดับสูง](/th/tools/elevated)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">นโยบายแซนด์บ็อกซ์และเครื่องมือ</span>
          <span>6 ความสามารถ / รองรับ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing), [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ระดับสูง](/th/gateway/sandbox-vs-tool-policy-vs-elevated), [เครื่องมือแซนด์บ็อกซ์สำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools), [ข้อมูลอ้างอิง Codex Harness](/th/plugins/codex-harness-reference), [เครื่องมือกำหนดค่า](/th/gateway/config-tools)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ OpenAI และ Codex - M3 เบตา - 5 ด้าน">
    <a id="openai-and-codex-provider-path" />

    เอกสารเชิงลึก เส้นทาง OAuth/การสมัครสมาชิก เสียงแบบเรียลไทม์ รูปภาพ และลักษณะการทำงานด้านความเข้ากันได้ การเปลี่ยนแปลงของผู้ให้บริการอย่างต่อเนื่องทำให้ส่วนนี้ยังไม่สามารถเข้าสู่ระดับเสถียรได้หากไม่มีหลักฐานจากตารางคะแนนประจำรุ่น

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 26%</span><span>คุณภาพ เบตา - 74%</span><span>ความสมบูรณ์ เบตา - 79%</span><span><span className="maturity-lts maturity-lts-partial">บางส่วน - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">โมเดลและการยืนยันตัวตน</span>
          <span>6 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenAI](/th/providers/openai), [ชุดควบคุม Codex](/th/plugins/codex-harness), [โมเดล](/th/concepts/models), [OAuth](/th/concepts/oauth), [ข้อมูลอ้างอิงชุดควบคุม Codex](/th/plugins/codex-harness-reference), [การเฝ้าติดตามการยืนยันตัวตน](/th/gateway/authentication)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความเข้ากันได้ของการตอบกลับและเครื่องมือ</span>
          <span>4 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenAI](/th/providers/openai), [HTTP API ของ OpenResponses](/th/gateway/openresponses-http-api), [HTTP API ของ OpenAI](/th/gateway/openai-http-api), [Plugin แบบเนทีฟของ Codex](/th/plugins/codex-native-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ชุดควบคุม Codex แบบเนทีฟ</span>
          <span>2 ความสามารถ / รองรับแบบ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ชุดควบคุม Codex](/th/plugins/codex-harness), [รันไทม์ของชุดควบคุม Codex](/th/plugins/codex-harness-runtime), [ข้อมูลอ้างอิงชุดควบคุม Codex](/th/plugins/codex-harness-reference), [Plugin แบบเนทีฟของ Codex](/th/plugins/codex-native-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รูปภาพและอินพุตหลายรูปแบบ</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenAI](/th/providers/openai), [การสร้างรูปภาพ](/th/tools/image-generation), [รูปภาพ](/th/nodes/images)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">เสียงพูดและเสียงแบบเรียลไทม์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[OpenAI](/th/providers/openai), [Discord](/th/channels/discord), [การโทรด้วยเสียง](/th/plugins/voice-call)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เครื่องมือค้นหาเว็บ - M3 เบตา - 4 ด้าน">
    <a id="web-search-tools" />

    มีผู้ให้บริการและเอกสารหลายรายการ ต้องมีหลักฐานเกี่ยวกับโควตา ข้อผิดพลาด และ SSRF สำหรับผู้ให้บริการแต่ละกลุ่ม

    <div className="maturity-surface-rollup"><span>ความครอบคลุม: ทดลอง - 9%</span><span>คุณภาพ: เบตา - 74%</span><span>ความสมบูรณ์: เบตา - 79%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ผู้ให้บริการการค้นหา</span>
          <span>19 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>11%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "11%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[เว็บ](/th/tools/web), [Brave Search](/th/tools/brave-search), [Tavily](/th/tools/tavily), [Exa Search](/th/tools/exa-search), [Firecrawl](/th/tools/firecrawl), [Perplexity Search](/th/tools/perplexity-search), [Duckduckgo Search](/th/tools/duckduckgo-search), [Searxng Search](/th/tools/searxng-search), [Gemini Search](/th/tools/gemini-search), [Grok Search](/th/tools/grok-search), [Kimi Search](/th/tools/kimi-search), [Minimax Search](/th/tools/minimax-search), [Ollama Search](/th/tools/ollama-search), [พาธย่อยของ SDK](/th/plugins/sdk-subpaths), [ภาพรวม SDK](/th/plugins/sdk-overview), [ไฟล์กำกับ](/th/plugins/manifest)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการวินิจฉัย</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[เว็บ](/th/tools/web), [การดึงข้อมูลจากเว็บ](/th/tools/web-fetch), [คำถามที่พบบ่อย](/th/help/faq), [ค่าใช้จ่ายในการใช้งาน API](/th/reference/api-usage-costs), [Brave Search](/th/tools/brave-search), [Perplexity Search](/th/tools/perplexity-search), [Tavily](/th/tools/tavily), [Firecrawl](/th/tools/firecrawl)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความปลอดภัยของเครือข่าย</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[เว็บ](/th/tools/web), [การดึงข้อมูลจากเว็บ](/th/tools/web-fetch), [Firecrawl](/th/tools/firecrawl), [Searxng Search](/th/tools/searxng-search)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความพร้อมใช้งานและการดึงข้อมูลของเครื่องมือ</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[เครื่องมือกำหนดค่า](/th/gateway/config-tools), [การดึงข้อมูลจากเว็บ](/th/tools/web-fetch), [เว็บ](/th/tools/web), [คำถามที่พบบ่อย](/th/help/faq)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ Anthropic - M3 เบตา - 5 ด้าน">
    <a id="anthropic-provider-path" />

    ผู้ให้บริการโมเดลที่รองรับโดยตรง ต้องมีหลักฐานจากสถานการณ์การยืนยันตัวตน แค็ตตาล็อก และการเรียกใช้เครื่องมือเป็นระยะ

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ เบตา - 71%</span><span>ความสมบูรณ์ เบตา - 78%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การยืนยันตัวตนและการกู้คืนของผู้ให้บริการ</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/th/providers/anthropic), [Doctor](/th/gateway/doctor), [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การแคชพรอมต์](/th/reference/prompt-caching)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การเลือกโมเดลและรันไทม์</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/th/providers/anthropic), [การกำหนดค่าเอเจนต์](/th/gateway/config-agents), [โมเดล](/th/concepts/models), [แบ็กเอนด์ CLI](/th/gateway/cli-backends)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การส่งคำขอและความหมายของรอบการโต้ตอบ</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/th/providers/anthropic), [การแคชพรอมต์](/th/reference/prompt-caching), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [แบ็กเอนด์ CLI](/th/gateway/cli-backends), [ผู้ให้บริการโมเดล](/th/concepts/model-providers)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">แคชพรอมต์และบริบท</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/th/providers/anthropic), [การแคชพรอมต์](/th/reference/prompt-caching), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [Heartbeat](/th/gateway/heartbeat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">อินพุตสื่อ</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/th/providers/anthropic), [การกำหนดค่าเอเจนต์](/th/gateway/config-agents)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ Google - M3 เบตา - 5 ด้าน">
    <a id="google-provider-path" />

    ผู้ให้บริการระดับเฟิร์สคลาสที่รองรับทั้งโมเดลและการทำงานแบบเรียลไทม์ จำเป็นต้องให้คะแนน Live/Talk แยกกัน

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับแอลฟา - 66%</span><span>ความสมบูรณ์ ระดับเบตา - 78%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ขอบเขต</span><span>การครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าผู้ให้บริการและข้อมูลประจำตัว</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/th/providers/google), [ผู้ให้บริการโมเดล](/th/concepts/model-providers)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางโมเดลและเอนด์พอยต์</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/th/providers/google), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [Google](/th/plugins/reference/google), [การค้นหาด้วย Gemini](/th/tools/gemini-search)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รันไทม์ Gemini โดยตรง</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/th/providers/google), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models), [การทดสอบแบบสด](/th/help/testing-live)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">สื่อ การค้นหา และการทำงานแบบเรียลไทม์</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/th/plugins/reference/google), [Google](/th/providers/google)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การแคชพรอมต์</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">แอลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[การแคชพรอมต์](/th/reference/prompt-caching), [Google](/th/providers/google), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [การใช้โทเค็น](/th/reference/token-use)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เส้นทางผู้ให้บริการ OpenRouter - M3 เบตา - 4 ขอบเขต">
    <a id="openrouter-provider-path" />

    เส้นทางผู้ให้บริการแบบรวมมีเอกสารประกอบและมีประโยชน์ แต่ลักษณะการทำงานเฉพาะของแต่ละโมเดลแตกต่างกัน

    <div className="maturity-surface-rollup"><span>การครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ แอลฟา - 66%</span><span>ความสมบูรณ์ เบตา - 78%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>การครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่าและการยืนยันตัวตนของผู้ให้บริการ</span>
          <span>14 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openrouter](/th/providers/openrouter), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [กำหนดค่า](/th/cli/configure), [การยืนยันตัวตน](/th/gateway/authentication), [สภาพแวดล้อม](/th/help/environment), [โมเดล](/th/cli/models), [โมเดล](/th/concepts/models)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">รันไทม์แชตและการปรับให้อยู่ในรูปแบบมาตรฐาน</span>
          <span>15 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openrouter](/th/providers/openrouter), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [การแคชพรอมต์](/th/reference/prompt-caching)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกู้คืนและการวินิจฉัยผู้ให้บริการ</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสลับโมเดลเมื่อเกิดข้อขัดข้อง](/th/concepts/model-failover), [Openrouter](/th/providers/openrouter), [โมเดล](/th/cli/models)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสร้างสื่อและเสียงพูด</span>
          <span>7 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">เบตา</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openrouter](/th/providers/openrouter), [การสร้างรูปภาพ](/th/tools/image-generation), [การสร้างเพลง](/th/tools/music-generation), [ภาพรวมสื่อ](/th/tools/media-overview), [การสร้างวิดีโอ](/th/tools/video-generation), [การแปลงข้อความเป็นเสียงพูด](/th/tools/tts)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="เครื่องมือสร้างรูปภาพ วิดีโอ และเพลง - M2 อัลฟา - 5 ด้าน">
    <a id="image-video-and-music-generation-tools" />

    ความสามารถนี้มีอยู่ในผู้ให้บริการหลายราย แต่คุณภาพ เวลาแฝง และความเข้ากันได้ของพารามิเตอร์แตกต่างกันมากเกินกว่าจะอยู่ในระดับเบตาได้ หากไม่มีหลักฐานแยกตามผู้ให้บริการ

    <div className="maturity-surface-rollup"><span>การครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ อัลฟา - 61%</span><span>ความสมบูรณ์ อัลฟา - 68%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การกำหนดเส้นทางและการค้นพบสื่อ</span>
          <span>4 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[เอเจนต์การกำหนดค่า](/th/gateway/config-agents), [การสร้างรูปภาพ](/th/tools/image-generation), [การสร้างวิดีโอ](/th/tools/video-generation), [การสร้างเพลง](/th/tools/music-generation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">วงจรชีวิตและการส่งมอบงาน</span>
          <span>12 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ภาพรวมสื่อ](/th/tools/media-overview), [การสร้างรูปภาพ](/th/tools/image-generation), [การสร้างวิดีโอ](/th/tools/video-generation), [การสร้างเพลง](/th/tools/music-generation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสร้างรูปภาพ</span>
          <span>9 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสร้างรูปภาพ](/th/tools/image-generation), [การอนุมาน](/th/cli/infer), [ภาพรวมสื่อ](/th/tools/media-overview)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสร้างวิดีโอ</span>
          <span>11 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสร้างวิดีโอ](/th/tools/video-generation), [Runway](/th/providers/runway), [Pixverse](/th/providers/pixverse), [Fal](/th/providers/fal), [Openrouter](/th/providers/openrouter)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การสร้างเพลง</span>
          <span>6 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[การสร้างเพลง](/th/tools/music-generation)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ผู้ให้บริการโมเดลภายในเครื่อง: Ollama, vLLM, SGLang, LM Studio - M2 อัลฟา - 5 ด้าน">
    <a id="local-model-providers-ollama-vllm-sglang-lm-studio" />

    มีประโยชน์และมีเอกสารประกอบ แต่มีความแปรผันระหว่างสภาพแวดล้อมสูง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ขั้นทดลอง - 0%</span><span>คุณภาพ อัลฟา - 61%</span><span>ความสมบูรณ์ อัลฟา - 68%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การตั้งค่า วงจรชีวิต และการวินิจฉัยของผู้ให้บริการ</span>
          <span>12 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[โมเดลภายในเครื่อง](/th/gateway/local-models), [Lmstudio](/th/providers/lmstudio), [Ollama](/th/providers/ollama), [Vllm](/th/providers/vllm), [บริการโมเดลภายในเครื่อง](/th/gateway/local-model-services), [การกำหนดค่าเอเจนต์](/th/gateway/config-agents), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [เครื่องมือวินิจฉัย](/th/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin ผู้ให้บริการแบบเนทีฟ</span>
          <span>10 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ollama](/th/providers/ollama), [Lmstudio](/th/providers/lmstudio)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความเข้ากันได้ของรันไทม์ที่รองรับ OpenAI</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Vllm](/th/providers/vllm), [Sglang](/th/providers/sglang), [โมเดลภายในเครื่อง](/th/gateway/local-models), [Lmstudio](/th/providers/lmstudio)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">หน่วยความจำและการฝังเวกเตอร์ภายในเครื่อง</span>
          <span>5 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[หน่วยความจำ](/th/concepts/memory), [เครื่องมือวินิจฉัย](/th/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ความปลอดภัยของเครือข่ายและการควบคุมพรอมต์</span>
          <span>2 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ขั้นทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">อัลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/gateway/security/index), [การกำหนดค่าเครื่องมือ](/th/gateway/config-tools), [โมเดลภายในเครื่อง](/th/gateway/local-models)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ผู้ให้บริการแบบโฮสต์กลุ่มเฉพาะทาง - M2 อัลฟา - 3 ด้าน">
    <a id="long-tail-hosted-providers" />

    มีหน้าเอกสารและหน้าอ้างอิงจำนวนมาก ควรสร้างคะแนนจากข้อมูลเมตาของผู้ให้บริการร่วมกับความครอบคลุมของการทดสอบเบื้องต้นกับระบบจริง

    <div className="maturity-surface-rollup"><span>ความครอบคลุม ระดับทดลอง - 0%</span><span>คุณภาพ ระดับแอลฟา - 61%</span><span>ความสมบูรณ์ ระดับแอลฟา - 68%</span><span><span className="maturity-lts maturity-lts-none">ไม่มี</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ด้าน</span><span>ความครอบคลุม</span><span>คุณภาพ</span><span>ความสมบูรณ์</span><span>เอกสาร</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ผู้ให้บริการ LLM แบบโฮสต์</span>
          <span>12 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/providers/index), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [การทดสอบระบบจริง](/th/help/testing-live), [การเริ่มต้นใช้งาน](/th/cli/onboard)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ผู้ให้บริการสื่อแบบโฮสต์</span>
          <span>8 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ไฟล์กำกับ](/th/plugins/manifest), [การทดสอบระบบจริง](/th/help/testing-live), [ดัชนี](/th/providers/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">การดำเนินงานของผู้ให้บริการ</span>
          <span>12 ความสามารถ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">ระดับทดลอง</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ระดับแอลฟา</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[ดัชนี](/th/providers/index), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ไฟล์กำกับ](/th/plugins/manifest), [การทดสอบระบบจริง](/th/help/testing-live), [โมเดล](/th/cli/models)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>
