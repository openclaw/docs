---
read_when:
    - คุณต้องการการป้องกันเชิงลึกต่อการโจมตีแบบ SSRF และ DNS rebinding
    - การกำหนดค่าพร็อกซีแบบส่งต่อภายนอกสำหรับทราฟฟิกรันไทม์ของ OpenClaw
summary: วิธีกำหนดเส้นทางทราฟฟิก HTTP และ WebSocket ของรันไทม์ OpenClaw ผ่านพร็อกซีกรองที่จัดการโดยผู้ปฏิบัติการ
title: พร็อกซีเครือข่าย
x-i18n:
    generated_at: "2026-05-07T16:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw สามารถกำหนดเส้นทางทราฟฟิก HTTP และ WebSocket ขณะรันผ่าน forward proxy ที่ผู้ปฏิบัติงานจัดการได้ ฟีเจอร์นี้เป็นการป้องกันเชิงลึกเพิ่มเติมแบบไม่บังคับสำหรับการปรับใช้ที่ต้องการการควบคุม egress แบบรวมศูนย์ การป้องกัน SSRF ที่เข้มงวดยิ่งขึ้น และความสามารถในการตรวจสอบเครือข่ายที่ดีขึ้น

OpenClaw ไม่ได้จัดส่ง ดาวน์โหลด เริ่มทำงาน กำหนดค่า หรือรับรอง proxy คุณเป็นผู้รันเทคโนโลยี proxy ที่เหมาะกับสภาพแวดล้อมของคุณ และ OpenClaw จะกำหนดเส้นทางไคลเอนต์ HTTP และ WebSocket ปกติที่อยู่ในโปรเซสเดียวกันผ่าน proxy นั้น

## ทำไมต้องใช้ proxy

proxy ช่วยให้ผู้ปฏิบัติงานมีจุดควบคุมเครือข่ายเดียวสำหรับทราฟฟิก HTTP และ WebSocket ขาออก ซึ่งอาจมีประโยชน์แม้นอกเหนือจากการเสริมความแข็งแกร่งต่อ SSRF:

- นโยบายแบบรวมศูนย์: ดูแลนโยบาย egress เพียงชุดเดียว แทนที่จะพึ่งพาให้ทุกจุดเรียก HTTP ของแอปพลิเคชันกำหนดกฎเครือข่ายให้ถูกต้อง
- การตรวจสอบขณะเชื่อมต่อ: ประเมินปลายทางหลังการแก้ชื่อ DNS และทันทีก่อนที่ proxy จะเปิดการเชื่อมต่อ upstream
- การป้องกัน DNS rebinding: ลดช่องว่างระหว่างการตรวจสอบ DNS ระดับแอปพลิเคชันกับการเชื่อมต่อขาออกจริง
- การครอบคลุม JavaScript ที่กว้างขึ้น: กำหนดเส้นทางไคลเอนต์ทั่วไป เช่น `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch และไคลเอนต์ที่คล้ายกันผ่านเส้นทางเดียวกัน
- ความสามารถในการตรวจสอบ: บันทึกปลายทางที่อนุญาตและปฏิเสธที่ขอบเขต egress
- การควบคุมเชิงปฏิบัติการ: บังคับใช้กฎปลายทาง การแบ่งส่วนเครือข่าย rate limit หรือ allowlist ขาออก โดยไม่ต้องสร้าง OpenClaw ใหม่

การกำหนดเส้นทาง proxy เป็น guardrail ระดับโปรเซสสำหรับ egress HTTP และ WebSocket ปกติ โดยให้เส้นทางแบบ fail-closed แก่ผู้ปฏิบัติงานสำหรับกำหนดเส้นทางไคลเอนต์ HTTP ของ JavaScript ที่รองรับผ่าน proxy กรองของตนเอง แต่ไม่ใช่ sandbox เครือข่ายระดับ OS และไม่ได้ทำให้ OpenClaw รับรองนโยบายปลายทางของ proxy

## OpenClaw กำหนดเส้นทางทราฟฟิกอย่างไร

เมื่อ `proxy.enabled=true` และมีการกำหนดค่า URL ของ proxy โปรเซสรันไทม์ที่ได้รับการป้องกัน เช่น `openclaw gateway run`, `openclaw node run` และ `openclaw agent --local` จะกำหนดเส้นทาง egress HTTP และ WebSocket ปกติผ่าน proxy ที่กำหนดค่าไว้:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

สัญญาสาธารณะคือพฤติกรรมการกำหนดเส้นทาง ไม่ใช่ hook ภายในของ Node ที่ใช้ในการนำไปใช้ ไคลเอนต์ WebSocket สำหรับ control-plane ของ OpenClaw Gateway ใช้เส้นทางตรงแบบแคบสำหรับทราฟฟิก RPC ของ Gateway แบบ local loopback เมื่อ URL ของ Gateway ใช้ `localhost` หรือ IP loopback แบบ literal เช่น `127.0.0.1` หรือ `[::1]` เส้นทาง control-plane นั้นต้องสามารถเข้าถึง Gateway แบบ loopback ได้ แม้ proxy ของผู้ปฏิบัติงานจะบล็อกปลายทาง loopback ก็ตาม คำขอ HTTP และ WebSocket ขณะรันปกติยังคงใช้ proxy ที่กำหนดค่าไว้

ภายใน OpenClaw ใช้ hook การกำหนดเส้นทางระดับโปรเซสสองแบบสำหรับฟีเจอร์นี้:

- การกำหนดเส้นทางด้วย Undici dispatcher ครอบคลุม `fetch`, ไคลเอนต์ที่ใช้ undici และ transport ที่จัดเตรียม undici dispatcher ของตนเอง
- การกำหนดเส้นทางด้วย `global-agent` ครอบคลุมผู้เรียกใช้ Node core `node:http` และ `node:https` รวมถึงไลบรารีจำนวนมากที่สร้างบน `http.request`, `https.request`, `http.get` และ `https.get` โหมด proxy ที่จัดการจะบังคับใช้ global agent นั้น เพื่อไม่ให้ Node HTTP agent ที่ระบุไว้ชัดเจนข้าม proxy ของผู้ปฏิบัติงานโดยไม่ตั้งใจ

Plugin บางตัวเป็นเจ้าของ transport แบบกำหนดเองที่ต้องต่อสาย proxy อย่างชัดเจน แม้จะมีการกำหนดเส้นทางระดับโปรเซสอยู่แล้ว ตัวอย่างเช่น transport Bot API ของ Telegram ใช้ HTTP/1 undici dispatcher ของตนเอง จึงเคารพ env ของ process proxy พร้อม fallback `OPENCLAW_PROXY_URL` ที่จัดการไว้ในเส้นทาง transport เฉพาะเจ้าของนั้น

URL ของ proxy เองต้องใช้ `http://` ปลายทาง HTTPS ยังคงรองรับผ่าน proxy ด้วย HTTP `CONNECT`; หมายความเพียงว่า OpenClaw คาดหวัง listener ของ HTTP forward-proxy แบบธรรมดา เช่น `http://127.0.0.1:3128`

ขณะที่ proxy ทำงานอยู่ OpenClaw จะล้าง `no_proxy`, `NO_PROXY` และ `GLOBAL_AGENT_NO_PROXY` รายการ bypass เหล่านั้นอิงตามปลายทาง ดังนั้นหากปล่อยให้มี `localhost` หรือ `127.0.0.1` อยู่ จะทำให้เป้าหมาย SSRF ที่มีความเสี่ยงสูงข้าม proxy กรองได้

เมื่อปิดการทำงาน OpenClaw จะกู้คืนสภาพแวดล้อม proxy ก่อนหน้าและรีเซ็ตสถานะการกำหนดเส้นทางของโปรเซสที่แคชไว้

## คำศัพท์ proxy ที่เกี่ยวข้อง

- `proxy.enabled` / `proxy.proxyUrl`: การกำหนดเส้นทาง outbound forward-proxy สำหรับ egress รันไทม์ของ OpenClaw หน้านี้อธิบายฟีเจอร์ดังกล่าว
- `gateway.auth.mode: "trusted-proxy"`: การยืนยันตัวตนของ reverse-proxy ขาเข้าที่รับรู้ตัวตนสำหรับการเข้าถึง Gateway ดู [การยืนยันตัวตนด้วย trusted proxy](/th/gateway/trusted-proxy-auth)
- `openclaw proxy`: proxy ดีบักภายในเครื่องและตัวตรวจสอบ capture สำหรับการพัฒนาและการสนับสนุน ดู [openclaw proxy](/th/cli/proxy)
- `tools.web.fetch.useTrustedEnvProxy`: opt-in สำหรับ `web_fetch` เพื่อให้ HTTP(S) env proxy ที่ผู้ปฏิบัติงานควบคุมแก้ชื่อ DNS ได้ โดยยังคงการ pin DNS แบบเข้มงวดและนโยบาย hostname ตามค่าเริ่มต้นไว้ ดู [Web fetch](/th/tools/web-fetch#trusted-env-proxy)
- การตั้งค่า proxy เฉพาะ channel หรือ provider: override เฉพาะเจ้าของสำหรับ transport รายหนึ่ง ควรใช้ network proxy ที่จัดการเมื่อเป้าหมายคือการควบคุม egress แบบรวมศูนย์ทั่วทั้งรันไทม์

## การกำหนดค่า

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

คุณยังสามารถระบุ URL ผ่านสภาพแวดล้อมได้ ขณะคง `proxy.enabled=true` ไว้ใน config:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` มีลำดับความสำคัญเหนือ `OPENCLAW_PROXY_URL`

### โหมด Loopback ของ Gateway

ไคลเอนต์ control-plane ของ Gateway ภายในเครื่องมักเชื่อมต่อกับ WebSocket แบบ loopback เช่น `ws://127.0.0.1:18789` ใช้ `proxy.loopbackMode` เพื่อเลือกว่าทราฟฟิกนั้นจะทำงานอย่างไรขณะที่ proxy ที่จัดการกำลังทำงานอยู่:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (ค่าเริ่มต้น): OpenClaw ลงทะเบียน authority loopback ของ Gateway ใน controller `NO_PROXY` ของ `global-agent` ที่ทำงานอยู่ เพื่อให้ทราฟฟิก WebSocket ของ Gateway ภายในเครื่องเชื่อมต่อโดยตรงได้ พอร์ต Gateway loopback แบบกำหนดเองใช้งานได้เพราะมีการลงทะเบียน host และ port ของ URL Gateway ที่ทำงานอยู่
- `proxy`: OpenClaw ไม่ลงทะเบียน authority `NO_PROXY` สำหรับ loopback ของ Gateway ดังนั้นทราฟฟิก Gateway ภายในเครื่องจะถูกส่งผ่าน proxy ที่จัดการ หาก proxy อยู่ระยะไกล ต้องมีการกำหนดเส้นทางพิเศษสำหรับบริการ loopback ของโฮสต์ OpenClaw เช่น map ไปยัง hostname, IP หรือ tunnel ที่ proxy เข้าถึงได้ proxy ระยะไกลมาตรฐานจะแก้ชื่อ `127.0.0.1` และ `localhost` จากโฮสต์ proxy ไม่ใช่จากโฮสต์ OpenClaw
- `block`: OpenClaw ปฏิเสธการเชื่อมต่อ control-plane ของ Gateway แบบ loopback ก่อนเปิด socket

หาก `enabled=true` แต่ไม่มี URL ของ proxy ที่ถูกต้องที่กำหนดค่าไว้ คำสั่งที่ได้รับการป้องกันจะล้มเหลวตอนเริ่มต้น แทนที่จะถอยกลับไปใช้การเข้าถึงเครือข่ายโดยตรง

สำหรับบริการ Gateway ที่จัดการซึ่งเริ่มด้วย `openclaw gateway start` แนะนำให้เก็บ URL ไว้ใน config:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

fallback ผ่านสภาพแวดล้อมเหมาะที่สุดสำหรับการรัน foreground หากใช้กับบริการที่ติดตั้งแล้ว ให้ใส่ `OPENCLAW_PROXY_URL` ในสภาพแวดล้อมถาวรของบริการ เช่น `$OPENCLAW_STATE_DIR/.env` หรือ `~/.openclaw/.env` แล้วติดตั้งบริการใหม่เพื่อให้ launchd, systemd หรือ Scheduled Tasks เริ่ม Gateway ด้วยค่านั้น

สำหรับคำสั่ง `openclaw --container ...` OpenClaw จะส่งต่อ `OPENCLAW_PROXY_URL` ไปยัง child CLI ที่กำหนดเป้าหมายเป็น container เมื่อมีการตั้งค่าไว้ URL ต้องเข้าถึงได้จากภายใน container; `127.0.0.1` หมายถึงตัว container เอง ไม่ใช่ host OpenClaw จะปฏิเสธ URL ของ proxy แบบ loopback สำหรับคำสั่งที่กำหนดเป้าหมายเป็น container เว้นแต่คุณจะ override การตรวจสอบความปลอดภัยนั้นอย่างชัดเจน

## ข้อกำหนดของ Proxy

นโยบาย proxy คือขอบเขตความปลอดภัย OpenClaw ไม่สามารถตรวจสอบได้ว่า proxy บล็อกเป้าหมายที่ถูกต้องหรือไม่

กำหนดค่า proxy ให้:

- Bind เฉพาะกับ loopback หรืออินเทอร์เฟซส่วนตัวที่เชื่อถือได้
- จำกัดการเข้าถึงเพื่อให้เฉพาะโปรเซส โฮสต์ container หรือบัญชีบริการของ OpenClaw เท่านั้นที่ใช้ได้
- แก้ชื่อปลายทางด้วยตัวเองและบล็อก IP ปลายทางหลังการแก้ชื่อ DNS
- ใช้นโยบายขณะเชื่อมต่อสำหรับทั้งคำขอ HTTP แบบธรรมดาและ tunnel HTTPS `CONNECT`
- ปฏิเสธ bypass ที่อิงตามปลายทางสำหรับ loopback, private, link-local, metadata, multicast, reserved หรือช่วง documentation
- หลีกเลี่ยง allowlist ของ hostname เว้นแต่คุณจะเชื่อถือเส้นทางการแก้ชื่อ DNS อย่างเต็มที่
- บันทึกปลายทาง การตัดสินใจ สถานะ และเหตุผล โดยไม่บันทึก request body, authorization header, cookie หรือความลับอื่น
- เก็บนโยบาย proxy ไว้ใน version control และตรวจทานการเปลี่ยนแปลงเหมือน configuration ที่อ่อนไหวด้านความปลอดภัย

## ปลายทางที่แนะนำให้บล็อก

ใช้ denylist นี้เป็นจุดเริ่มต้นสำหรับ forward proxy, firewall หรือนโยบาย egress ใด ๆ

ตรรกะ classifier ระดับแอปพลิเคชันของ OpenClaw อยู่ใน `src/infra/net/ssrf.ts` และ `src/shared/net/ip.ts` hook parity ที่เกี่ยวข้องคือ `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` และการจัดการ sentinel IPv4 แบบฝังสำหรับ NAT64, 6to4, Teredo, ISATAP และรูปแบบ IPv4-mapped ไฟล์เหล่านั้นเป็นเอกสารอ้างอิงที่มีประโยชน์เมื่อดูแลนโยบาย proxy ภายนอก แต่ OpenClaw ไม่ได้ export หรือบังคับใช้กฎเหล่านั้นใน proxy ของคุณโดยอัตโนมัติ

| ช่วงหรือ host                                                                        | เหตุผลที่ต้องบล็อก                                      |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                            |
| `::1/128`                                                                            | IPv6 loopback                                            |
| `0.0.0.0/8`, `::/128`                                                                | ที่อยู่แบบไม่ระบุและที่อยู่ this-network                |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | เครือข่ายส่วนตัว RFC1918                                |
| `169.254.0.0/16`, `fe80::/10`                                                        | ที่อยู่ link-local และเส้นทาง metadata ของคลาวด์ที่พบบ่อย |
| `169.254.169.254`, `metadata.google.internal`                                        | บริการ metadata ของคลาวด์                               |
| `100.64.0.0/10`                                                                      | พื้นที่ที่อยู่ shared address ของ carrier-grade NAT      |
| `198.18.0.0/15`, `2001:2::/48`                                                       | ช่วง benchmarking                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | ช่วง special-use และ documentation                       |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                                |
| `240.0.0.0/4`                                                                        | IPv4 ที่สงวนไว้                                         |
| `fc00::/7`, `fec0::/10`                                                              | ช่วง IPv6 local/private                                  |
| `100::/64`, `2001:20::/28`                                                           | ช่วง IPv6 discard และ ORCHIDv2                           |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | prefix NAT64 ที่มี IPv4 ฝังอยู่                         |
| `2002::/16`, `2001::/32`                                                             | 6to4 และ Teredo ที่มี IPv4 ฝังอยู่                       |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 แบบ IPv4-compatible และ IPv4-mapped                 |

หากผู้ให้บริการคลาวด์หรือแพลตฟอร์มเครือข่ายของคุณระบุ host metadata หรือช่วงที่สงวนเพิ่มเติมไว้ ให้เพิ่มรายการเหล่านั้นด้วย

## การตรวจสอบความถูกต้อง

ตรวจสอบ proxy จาก host, container หรือบัญชีบริการเดียวกับที่รัน OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

โดยค่าเริ่มต้น เมื่อไม่ได้ระบุปลายทางแบบกำหนดเอง คำสั่งจะตรวจสอบว่า `https://example.com/` สำเร็จ และเริ่ม canary แบบ loopback ชั่วคราวที่พร็อกซีต้องเข้าถึงไม่ได้ การตรวจสอบการปฏิเสธเริ่มต้นจะผ่านเมื่อพร็อกซีส่งคืนการตอบกลับปฏิเสธที่ไม่ใช่ 2xx หรือบล็อก canary ด้วยความล้มเหลวระดับ transport และจะล้มเหลวหากมีการตอบกลับที่สำเร็จไปถึง canary หากไม่มีการเปิดใช้และกำหนดค่าพร็อกซี การตรวจสอบจะรายงานปัญหาการกำหนดค่า ให้ใช้ `--proxy-url` สำหรับการตรวจสอบ preflight แบบครั้งเดียวก่อนเปลี่ยนการกำหนดค่า ใช้ `--allowed-url` และ `--denied-url` เพื่อทดสอบความคาดหวังเฉพาะของการปรับใช้ เพิ่ม `--apns-reachable` เพื่อยืนยันด้วยว่าการส่ง APNs HTTP/2 โดยตรงสามารถเปิด CONNECT tunnel ผ่านพร็อกซีและรับการตอบกลับ APNs sandbox ได้ โพรบใช้ provider token ที่ตั้งใจให้ไม่ถูกต้อง ดังนั้น `403 InvalidProviderToken` จึงเป็นสิ่งที่คาดไว้และนับว่าเข้าถึงได้ ปลายทางที่ถูกปฏิเสธแบบกำหนดเองเป็นแบบ fail-closed: การตอบกลับ HTTP ใดๆ หมายความว่าปลายทางนั้นเข้าถึงได้ผ่านพร็อกซี และข้อผิดพลาดระดับ transport ใดๆ จะถูกรายงานว่าไม่สามารถสรุปได้ เพราะ OpenClaw ไม่สามารถพิสูจน์ได้ว่าพร็อกซีบล็อก origin ที่เข้าถึงได้ เมื่อการตรวจสอบล้มเหลว คำสั่งจะออกด้วยรหัส 1

ใช้ `--json` สำหรับระบบอัตโนมัติ เอาต์พุต JSON มีผลลัพธ์โดยรวม แหล่งที่มาของการกำหนดค่าพร็อกซีที่มีผลใช้งาน ข้อผิดพลาดการกำหนดค่าใดๆ และการตรวจสอบปลายทางแต่ละรายการ ข้อมูลรับรองใน URL ของพร็อกซีจะถูกปกปิดในเอาต์พุตทั้งแบบข้อความและ JSON:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

คุณยังสามารถตรวจสอบด้วยตนเองโดยใช้ `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

คำขอสาธารณะควรสำเร็จ คำขอ loopback และ metadata ควรถูกพร็อกซีบล็อก สำหรับ `openclaw proxy validate` canary แบบ loopback ในตัวสามารถแยกการปฏิเสธของพร็อกซีออกจาก origin ที่เข้าถึงได้ การตรวจสอบ `--denied-url` แบบกำหนดเองไม่มี canary นั้น ดังนั้นให้ถือว่าทั้งการตอบกลับ HTTP และความล้มเหลวระดับ transport ที่กำกวมเป็นความล้มเหลวของการตรวจสอบ เว้นแต่พร็อกซีของคุณจะเปิดเผยสัญญาณการปฏิเสธเฉพาะของการปรับใช้ที่คุณสามารถยืนยันแยกต่างหากได้

จากนั้นเปิดใช้การกำหนดเส้นทางพร็อกซีของ OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

หรือกำหนด:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## ขีดจำกัด

- พร็อกซีช่วยเพิ่มการครอบคลุมสำหรับไคลเอนต์ JavaScript HTTP และ WebSocket ภายในโปรเซส แต่ไม่ใช่ network sandbox ระดับ OS
- ทราฟฟิก control-plane แบบ loopback ของ Gateway มีค่าเริ่มต้นเป็นการข้ามแบบ local โดยตรงผ่าน `proxy.loopbackMode: "gateway-only"` OpenClaw ใช้การข้ามนี้โดยลงทะเบียน authority ของ loopback ของ Gateway ที่ใช้งานอยู่ในตัวควบคุม `NO_PROXY` ของ `global-agent` ที่จัดการไว้ ผู้ปฏิบัติงานสามารถตั้งค่า `proxy.loopbackMode: "proxy"` เพื่อส่งทราฟฟิก loopback ของ Gateway ผ่านพร็อกซีที่จัดการไว้ หรือ `proxy.loopbackMode: "block"` เพื่อปฏิเสธการเชื่อมต่อ Gateway แบบ loopback ดู [โหมด Loopback ของ Gateway](#gateway-loopback-mode) สำหรับข้อควรระวังเกี่ยวกับพร็อกซีระยะไกล
- ซ็อกเก็ต `net`, `tls` และ `http2` แบบ raw, native addons และโปรเซสลูกที่ไม่ใช่ OpenClaw อาจข้ามการกำหนดเส้นทางพร็อกซีระดับ Node เว้นแต่จะสืบทอดและเคารพตัวแปรสภาพแวดล้อมพร็อกซี CLI ลูกของ OpenClaw ที่ fork จะสืบทอด URL พร็อกซีที่จัดการไว้และสถานะ `proxy.loopbackMode`
- IRC เป็นช่องทาง TCP/TLS แบบ raw ที่อยู่นอกการกำหนดเส้นทาง forward proxy ที่ผู้ปฏิบัติงานจัดการ ในการปรับใช้ที่กำหนดให้ egress ทั้งหมดต้องผ่าน forward proxy นั้น ให้ตั้งค่า `channels.irc.enabled=false` เว้นแต่ direct IRC egress จะได้รับการอนุมัติอย่างชัดเจน
- พร็อกซีดีบักภายในเครื่องเป็นเครื่องมือวินิจฉัย และการส่งต่อ upstream โดยตรงสำหรับคำขอพร็อกซีและ CONNECT tunnel จะถูกปิดใช้งานโดยค่าเริ่มต้นขณะที่โหมดพร็อกซีที่จัดการไว้ทำงาน เปิดใช้การส่งต่อโดยตรงเฉพาะสำหรับการวินิจฉัยภายในเครื่องที่ได้รับอนุมัติแล้วเท่านั้น
- WebUI ภายในเครื่องของผู้ใช้และเซิร์ฟเวอร์โมเดลภายในเครื่องควรถูกเพิ่มใน allowlist ของนโยบายพร็อกซีของผู้ปฏิบัติงานเมื่อจำเป็น OpenClaw ไม่เปิดเผยการข้ามเครือข่ายภายในเครื่องแบบทั่วไปสำหรับสิ่งเหล่านั้น
- การข้ามพร็อกซีของ control-plane ของ Gateway จำกัดไว้เฉพาะ `localhost` และ URL ที่เป็น IP loopback แบบ literal โดยตั้งใจ ใช้ `ws://127.0.0.1:18789`, `ws://[::1]:18789` หรือ `ws://localhost:18789` สำหรับการเชื่อมต่อ control-plane ของ Gateway ภายในเครื่องโดยตรง โฮสต์เนมอื่นจะถูกกำหนดเส้นทางเหมือนทราฟฟิกแบบใช้โฮสต์เนมทั่วไป
- OpenClaw ไม่ตรวจสอบ ทดสอบ หรือรับรองนโยบายพร็อกซีของคุณ
- ให้ถือว่าการเปลี่ยนแปลงนโยบายพร็อกซีเป็นการเปลี่ยนแปลงด้านปฏิบัติการที่อ่อนไหวต่อความปลอดภัย

| พื้นผิว                                                     | สถานะพร็อกซีที่จัดการไว้                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, ไคลเอนต์ WebSocket ทั่วไป | ถูกกำหนดเส้นทางผ่าน hook ของพร็อกซีที่จัดการไว้เมื่อกำหนดค่าแล้ว                                                |
| APNs HTTP/2 โดยตรง                                           | ถูกกำหนดเส้นทางผ่านตัวช่วย CONNECT ของ APNs ที่จัดการไว้                                                    |
| loopback ของ control-plane ของ Gateway                               | โดยตรงเฉพาะสำหรับ URL Gateway แบบ local loopback ที่กำหนดค่าไว้                                         |
| การส่งต่อ upstream ของพร็อกซีดีบัก                              | ปิดใช้งานขณะที่โหมดพร็อกซีที่จัดการไว้ทำงาน เว้นแต่จะเปิดใช้อย่างชัดเจนสำหรับการวินิจฉัยภายในเครื่อง       |
| IRC                                                          | TCP/TLS แบบ raw; ไม่ถูกพร็อกซีโดยโหมดพร็อกซี HTTP ที่จัดการไว้ ปิดใช้งานเว้นแต่ direct IRC egress จะได้รับอนุมัติ |
| การเรียกไคลเอนต์ `net`, `tls` หรือ `http2` แบบ raw อื่นๆ              | ต้องถูกจัดประเภทโดย raw socket guard ก่อน landing                                         |
