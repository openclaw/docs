---
read_when:
    - คุณต้องการการป้องกันเชิงลึกเพื่อรับมือกับการโจมตีแบบ SSRF และ DNS rebinding
    - การกำหนดค่าพร็อกซีส่งต่อภายนอกสำหรับการรับส่งข้อมูลขณะทำงานของ OpenClaw
summary: วิธีกำหนดเส้นทางทราฟฟิก HTTP และ WebSocket ของรันไทม์ OpenClaw ผ่านพร็อกซีกรองที่ผู้ปฏิบัติการจัดการ
title: พร็อกซีเครือข่าย
x-i18n:
    generated_at: "2026-05-06T18:01:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw สามารถกำหนดเส้นทางทราฟฟิก HTTP และ WebSocket ระหว่างรันไทม์ผ่าน forward proxy ที่ผู้ดูแลระบบจัดการได้ นี่เป็นการป้องกันเชิงลึกแบบเลือกใช้ สำหรับการปรับใช้ที่ต้องการการควบคุม egress จากศูนย์กลาง การป้องกัน SSRF ที่แข็งแรงขึ้น และความสามารถในการตรวจสอบเครือข่ายที่ดีขึ้น

OpenClaw ไม่ได้จัดส่ง ดาวน์โหลด เริ่มต้น กำหนดค่า หรือรับรองพร็อกซี คุณเรียกใช้เทคโนโลยีพร็อกซีที่เหมาะกับสภาพแวดล้อมของคุณ และ OpenClaw จะกำหนดเส้นทางไคลเอนต์ HTTP และ WebSocket แบบ process-local ปกติผ่านพร็อกซีนั้น

## เหตุผลที่ใช้พร็อกซี

พร็อกซีให้จุดควบคุมเครือข่ายจุดเดียวแก่ผู้ดูแลระบบสำหรับทราฟฟิก HTTP และ WebSocket ขาออก ซึ่งมีประโยชน์ได้แม้อยู่นอกเหนือจากการเสริมความปลอดภัย SSRF:

- นโยบายจากศูนย์กลาง: ดูแลนโยบาย egress เพียงชุดเดียว แทนที่จะพึ่งพาให้ทุกจุดเรียก HTTP ของแอปพลิเคชันตั้งกฎเครือข่ายให้ถูกต้อง
- การตรวจสอบขณะเชื่อมต่อ: ประเมินปลายทางหลังการแก้ DNS และทันทีก่อนที่พร็อกซีจะเปิดการเชื่อมต่อ upstream
- การป้องกัน DNS rebinding: ลดช่องว่างระหว่างการตรวจสอบ DNS ระดับแอปพลิเคชันกับการเชื่อมต่อขาออกจริง
- การครอบคลุม JavaScript ที่กว้างขึ้น: กำหนดเส้นทาง `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch และไคลเอนต์ลักษณะใกล้เคียงผ่านเส้นทางเดียวกัน
- ความสามารถในการตรวจสอบ: บันทึกปลายทางที่อนุญาตและถูกปฏิเสธที่ขอบเขต egress
- การควบคุมเชิงปฏิบัติการ: บังคับใช้กฎปลายทาง การแบ่งส่วนเครือข่าย rate limit หรือ allowlist ขาออกโดยไม่ต้องสร้าง OpenClaw ใหม่

การกำหนดเส้นทางผ่านพร็อกซีเป็น guardrail ระดับกระบวนการสำหรับ HTTP และ WebSocket egress ปกติ โดยให้เส้นทางแบบ fail-closed แก่ผู้ดูแลระบบสำหรับกำหนดเส้นทางไคลเอนต์ HTTP ของ JavaScript ที่รองรับผ่านพร็อกซีกรองของตนเอง แต่ไม่ใช่ sandbox เครือข่ายระดับ OS และไม่ได้ทำให้ OpenClaw รับรองนโยบายปลายทางของพร็อกซี

## วิธีที่ OpenClaw กำหนดเส้นทางทราฟฟิก

เมื่อ `proxy.enabled=true` และมีการกำหนดค่า URL ของพร็อกซี กระบวนการรันไทม์ที่ได้รับการป้องกัน เช่น `openclaw gateway run`, `openclaw node run` และ `openclaw agent --local` จะกำหนดเส้นทาง HTTP และ WebSocket egress ปกติผ่านพร็อกซีที่กำหนดค่าไว้:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

สัญญาสาธารณะคือพฤติกรรมการกำหนดเส้นทาง ไม่ใช่ hook ภายในของ Node ที่ใช้ในการนำไปใช้งาน ไคลเอนต์ WebSocket ของ control plane ของ OpenClaw Gateway ใช้เส้นทางตรงแบบแคบสำหรับทราฟฟิก RPC ของ local loopback Gateway เมื่อ URL ของ Gateway ใช้ `localhost` หรือ IP loopback แบบ literal เช่น `127.0.0.1` หรือ `[::1]` เส้นทาง control plane นั้นต้องเข้าถึง Gateway แบบ loopback ได้แม้พร็อกซีของผู้ดูแลระบบจะบล็อกปลายทาง loopback ก็ตาม คำขอ HTTP และ WebSocket ระหว่างรันไทม์ปกติยังคงใช้พร็อกซีที่กำหนดค่าไว้

ภายใน OpenClaw ใช้ hook การกำหนดเส้นทางระดับกระบวนการสองตัวสำหรับฟีเจอร์นี้:

- การกำหนดเส้นทางด้วย dispatcher ของ Undici ครอบคลุม `fetch`, ไคลเอนต์ที่อิงกับ undici และ transport ที่มี dispatcher ของ undici เป็นของตนเอง
- การกำหนดเส้นทางด้วย `global-agent` ครอบคลุมผู้เรียก Node core `node:http` และ `node:https` รวมถึงไลบรารีจำนวนมากที่สร้างบน `http.request`, `https.request`, `http.get` และ `https.get` โหมดพร็อกซีแบบมีการจัดการจะบังคับใช้ global agent นั้น เพื่อไม่ให้ agent ของ Node HTTP ที่ระบุอย่างชัดเจนหลุดเลี่ยงพร็อกซีของผู้ดูแลระบบโดยไม่ตั้งใจ

Plugin บางตัวเป็นเจ้าของ transport แบบกำหนดเองที่ต้องเดินสายพร็อกซีโดยชัดเจน แม้จะมีการกำหนดเส้นทางระดับกระบวนการอยู่แล้ว ตัวอย่างเช่น transport ของ Bot API ของ Telegram ใช้ dispatcher HTTP/1 ของ undici เป็นของตัวเอง ดังนั้นจึงเคารพ env ของพร็อกซีกระบวนการ รวมถึง fallback `OPENCLAW_PROXY_URL` แบบมีการจัดการในเส้นทาง transport เฉพาะเจ้าของนั้น

URL ของพร็อกซีเองต้องใช้ `http://` ยังรองรับปลายทาง HTTPS ผ่านพร็อกซีด้วย HTTP `CONNECT`; นี่หมายความเพียงว่า OpenClaw คาดหวัง listener ของ HTTP forward-proxy แบบ plain เช่น `http://127.0.0.1:3128`

ขณะที่พร็อกซีทำงานอยู่ OpenClaw จะล้าง `no_proxy`, `NO_PROXY` และ `GLOBAL_AGENT_NO_PROXY` รายการ bypass เหล่านี้อิงตามปลายทาง ดังนั้นหากปล่อย `localhost` หรือ `127.0.0.1` ไว้ในนั้น เป้าหมาย SSRF ที่มีความเสี่ยงสูงจะข้ามพร็อกซีกรองได้

เมื่อปิดการทำงาน OpenClaw จะคืนค่าสภาพแวดล้อมพร็อกซีเดิมและรีเซ็ตสถานะการกำหนดเส้นทางของกระบวนการที่แคชไว้

## คำศัพท์พร็อกซีที่เกี่ยวข้อง

- `proxy.enabled` / `proxy.proxyUrl`: การกำหนดเส้นทาง forward-proxy ขาออกสำหรับ egress ระหว่างรันไทม์ของ OpenClaw หน้านี้อธิบายฟีเจอร์นั้น
- `gateway.auth.mode: "trusted-proxy"`: การยืนยันตัวตนแบบ reverse-proxy ขาเข้าที่รับรู้ตัวตนสำหรับการเข้าถึง Gateway ดู [การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือ](/th/gateway/trusted-proxy-auth)
- `openclaw proxy`: พร็อกซีดีบักภายในเครื่องและตัวตรวจสอบการจับข้อมูลสำหรับการพัฒนาและซัพพอร์ต ดู [openclaw proxy](/th/cli/proxy)
- `tools.web.fetch.useTrustedEnvProxy`: การเลือกใช้สำหรับ `web_fetch` เพื่อให้พร็อกซี env HTTP(S) ที่ผู้ดูแลระบบควบคุมแก้ DNS ได้ ขณะยังคงใช้การ pin DNS และนโยบายชื่อโฮสต์แบบเข้มงวดตามค่าเริ่มต้น ดู [Web fetch](/th/tools/web-fetch#trusted-env-proxy)
- การตั้งค่าพร็อกซีเฉพาะช่องทางหรือ provider: override เฉพาะเจ้าของสำหรับ transport ใด transport หนึ่ง ควรใช้พร็อกซีเครือข่ายแบบมีการจัดการเมื่อเป้าหมายคือการควบคุม egress จากศูนย์กลางทั่วทั้งรันไทม์

## การกำหนดค่า

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

คุณยังสามารถระบุ URL ผ่านสภาพแวดล้อมได้ โดยยังคง `proxy.enabled=true` ไว้ในการกำหนดค่า:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` มีลำดับความสำคัญเหนือ `OPENCLAW_PROXY_URL`

### โหมด Loopback ของ Gateway

โดยปกติไคลเอนต์ control-plane ของ Gateway ภายในเครื่องจะเชื่อมต่อกับ WebSocket แบบ loopback เช่น `ws://127.0.0.1:18789` ใช้ `proxy.loopbackMode` เพื่อเลือกว่าทราฟฟิกนั้นทำงานอย่างไรขณะพร็อกซีแบบมีการจัดการทำงานอยู่:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (ค่าเริ่มต้น): OpenClaw ลงทะเบียน authority ของ loopback Gateway ในตัวควบคุม `NO_PROXY` ของ `global-agent` ที่ทำงานอยู่ เพื่อให้ทราฟฟิก WebSocket ของ Gateway ภายในเครื่องเชื่อมต่อโดยตรงได้ พอร์ต Gateway แบบ loopback ที่กำหนดเองทำงานได้เพราะ host และ port ของ URL Gateway ที่ทำงานอยู่ถูกลงทะเบียนไว้
- `proxy`: OpenClaw ไม่ลงทะเบียน authority ของ loopback Gateway ใน `NO_PROXY` ดังนั้นทราฟฟิก Gateway ภายในเครื่องจะถูกส่งผ่านพร็อกซีแบบมีการจัดการ หากพร็อกซีอยู่ระยะไกล พร็อกซีนั้นต้องมีการกำหนดเส้นทางพิเศษสำหรับบริการ loopback ของ host OpenClaw เช่น mapping ไปยังชื่อโฮสต์ IP หรือ tunnel ที่พร็อกซีเข้าถึงได้ พร็อกซีระยะไกลมาตรฐานจะแก้ `127.0.0.1` และ `localhost` จาก host ของพร็อกซี ไม่ใช่จาก host ของ OpenClaw
- `block`: OpenClaw ปฏิเสธการเชื่อมต่อ control-plane ของ loopback Gateway ก่อนเปิด socket

หาก `enabled=true` แต่ไม่มี URL พร็อกซีที่ถูกต้องที่กำหนดค่าไว้ คำสั่งที่ได้รับการป้องกันจะเริ่มต้นล้มเหลวแทนที่จะ fallback ไปใช้การเข้าถึงเครือข่ายโดยตรง

สำหรับบริการ Gateway แบบมีการจัดการที่เริ่มด้วย `openclaw gateway start` ควรเก็บ URL ไว้ในการกำหนดค่า:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

fallback ผ่านสภาพแวดล้อมเหมาะที่สุดสำหรับการรัน foreground หากคุณใช้กับบริการที่ติดตั้งแล้ว ให้ใส่ `OPENCLAW_PROXY_URL` ไว้ในสภาพแวดล้อมถาวรของบริการ เช่น `$OPENCLAW_STATE_DIR/.env` หรือ `~/.openclaw/.env` แล้วติดตั้งบริการใหม่เพื่อให้ launchd, systemd หรือ Scheduled Tasks เริ่ม Gateway ด้วยค่านั้น

สำหรับคำสั่ง `openclaw --container ...` OpenClaw จะส่งต่อ `OPENCLAW_PROXY_URL` เข้าไปยัง CLI ลูกที่มีเป้าหมายเป็นคอนเทนเนอร์เมื่อมีการตั้งค่า URL ต้องเข้าถึงได้จากภายในคอนเทนเนอร์; `127.0.0.1` หมายถึงตัวคอนเทนเนอร์เอง ไม่ใช่ host OpenClaw จะปฏิเสธ URL พร็อกซีแบบ loopback สำหรับคำสั่งที่มีเป้าหมายเป็นคอนเทนเนอร์ เว้นแต่คุณจะ override การตรวจสอบความปลอดภัยนั้นอย่างชัดเจน

## ข้อกำหนดของพร็อกซี

นโยบายพร็อกซีคือขอบเขตความปลอดภัย OpenClaw ไม่สามารถตรวจสอบได้ว่าพร็อกซีบล็อกเป้าหมายที่ถูกต้องหรือไม่

กำหนดค่าพร็อกซีให้:

- bind เฉพาะกับ loopback หรือ interface ส่วนตัวที่เชื่อถือได้
- จำกัดการเข้าถึงให้เฉพาะกระบวนการ host คอนเทนเนอร์ หรือ service account ของ OpenClaw ที่ใช้งานได้
- แก้ปลายทางด้วยตนเองและบล็อก IP ปลายทางหลังการแก้ DNS
- ใช้นโยบายขณะเชื่อมต่อสำหรับทั้งคำขอ HTTP แบบ plain และ tunnel HTTPS `CONNECT`
- ปฏิเสธ bypass ที่อิงตามปลายทางสำหรับช่วง loopback, private, link-local, metadata, multicast, reserved หรือ documentation
- หลีกเลี่ยง allowlist ของชื่อโฮสต์ เว้นแต่คุณจะเชื่อถือเส้นทางการแก้ DNS อย่างสมบูรณ์
- บันทึกปลายทาง การตัดสินใจ สถานะ และเหตุผล โดยไม่บันทึก body ของคำขอ authorization header, cookie หรือความลับอื่นๆ
- เก็บนโยบายพร็อกซีไว้ภายใต้ version control และตรวจทานการเปลี่ยนแปลงเหมือนการกำหนดค่าที่ไวต่อความปลอดภัย

## ปลายทางที่แนะนำให้บล็อก

ใช้ denylist นี้เป็นจุดเริ่มต้นสำหรับ forward proxy, firewall หรือนโยบาย egress ใดๆ

ตรรกะ classifier ระดับแอปพลิเคชันของ OpenClaw อยู่ใน `src/infra/net/ssrf.ts` และ `src/shared/net/ip.ts` hook ความสอดคล้องที่เกี่ยวข้องคือ `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` และการจัดการ sentinel ของ IPv4 แบบฝังสำหรับ NAT64, 6to4, Teredo, ISATAP และรูปแบบ IPv4-mapped ไฟล์เหล่านั้นเป็นแหล่งอ้างอิงที่มีประโยชน์เมื่อดูแลนโยบายพร็อกซีภายนอก แต่ OpenClaw ไม่ได้ export หรือบังคับใช้กฎเหล่านั้นในพร็อกซีของคุณโดยอัตโนมัติ

| ช่วงหรือ host                                                                        | เหตุผลที่บล็อก                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | ที่อยู่แบบไม่ระบุและที่อยู่ this-network               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | เครือข่ายส่วนตัว RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | ที่อยู่ link-local และเส้นทาง metadata ของคลาวด์ที่พบบ่อย |
| `169.254.169.254`, `metadata.google.internal`                                        | บริการ metadata ของคลาวด์                              |
| `100.64.0.0/10`                                                                      | พื้นที่ที่อยู่ร่วมของ carrier-grade NAT               |
| `198.18.0.0/15`, `2001:2::/48`                                                       | ช่วง benchmarking                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | ช่วง special-use และ documentation                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 ที่สงวนไว้                                        |
| `fc00::/7`, `fec0::/10`                                                              | ช่วง local/private ของ IPv6                            |
| `100::/64`, `2001:20::/28`                                                           | ช่วง discard และ ORCHIDv2 ของ IPv6                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | prefix NAT64 ที่มี IPv4 ฝังอยู่                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 และ Teredo ที่มี IPv4 ฝังอยู่                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 แบบ IPv4-compatible และ IPv4-mapped                 |

หากผู้ให้บริการคลาวด์หรือแพลตฟอร์มเครือข่ายของคุณมีเอกสารระบุ host metadata หรือช่วงที่สงวนไว้เพิ่มเติม ให้เพิ่มรายการเหล่านั้นด้วย

## การตรวจสอบความถูกต้อง

ตรวจสอบพร็อกซีจาก host คอนเทนเนอร์ หรือ service account เดียวกันที่รัน OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

โดยค่าเริ่มต้น เมื่อไม่ได้ระบุปลายทางที่กำหนดเอง คำสั่งจะตรวจสอบว่า `https://example.com/` สำเร็จ และเริ่ม canary แบบ loopback ชั่วคราวที่ proxy ต้องเข้าถึงไม่ได้ การตรวจสอบการปฏิเสธเริ่มต้นจะผ่านเมื่อ proxy ส่งคืนการตอบสนองปฏิเสธที่ไม่ใช่ 2xx หรือบล็อก canary ด้วยความล้มเหลวของการขนส่งข้อมูล และจะล้มเหลวหากการตอบสนองที่สำเร็จไปถึง canary หากไม่มี proxy ที่เปิดใช้งานและกำหนดค่าไว้ การตรวจสอบจะรายงานปัญหา config ให้ใช้ `--proxy-url` สำหรับ preflight แบบครั้งเดียวก่อนเปลี่ยน config ใช้ `--allowed-url` และ `--denied-url` เพื่อทดสอบความคาดหวังเฉพาะการปรับใช้ เพิ่ม `--apns-reachable` เพื่อยืนยันด้วยว่าการส่ง APNs HTTP/2 โดยตรงสามารถเปิดอุโมงค์ CONNECT ผ่าน proxy และได้รับการตอบสนองจาก APNs sandbox ได้; probe ใช้โทเค็นผู้ให้บริการที่ตั้งใจให้ไม่ถูกต้อง ดังนั้น `403 InvalidProviderToken` จึงเป็นผลที่คาดหวังและนับว่าเข้าถึงได้ ปลายทางที่ถูกปฏิเสธแบบกำหนดเองเป็นแบบ fail-closed: การตอบสนอง HTTP ใดๆ หมายความว่าปลายทางเข้าถึงได้ผ่าน proxy และข้อผิดพลาดการขนส่งข้อมูลใดๆ จะถูกรายงานว่าไม่อาจสรุปได้ เพราะ OpenClaw ไม่สามารถพิสูจน์ได้ว่า proxy บล็อกต้นทางที่เข้าถึงได้ เมื่อการตรวจสอบล้มเหลว คำสั่งจะออกด้วยรหัส 1

ใช้ `--json` สำหรับระบบอัตโนมัติ เอาต์พุต JSON มีผลลัพธ์โดยรวม แหล่งที่มาของ config proxy ที่มีผลใช้งาน ข้อผิดพลาด config ใดๆ และการตรวจสอบปลายทางแต่ละรายการ ข้อมูลประจำตัวใน URL ของ proxy จะถูกปกปิดในเอาต์พุตข้อความและ JSON:

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

คุณยังสามารถตรวจสอบด้วยตนเองด้วย `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

คำขอสาธารณะควรสำเร็จ คำขอ loopback และ metadata ควรถูก proxy บล็อก สำหรับ `openclaw proxy validate` canary แบบ loopback ในตัวสามารถแยกแยะการปฏิเสธจาก proxy ออกจากต้นทางที่เข้าถึงได้ การตรวจสอบ `--denied-url` แบบกำหนดเองไม่มี canary นั้น ดังนั้นให้ถือว่าทั้งการตอบสนอง HTTP และความล้มเหลวของการขนส่งข้อมูลที่กำกวมเป็นความล้มเหลวของการตรวจสอบ เว้นแต่ proxy ของคุณจะเปิดเผยสัญญาณการปฏิเสธเฉพาะการปรับใช้ที่คุณสามารถตรวจสอบแยกต่างหากได้

จากนั้นเปิดใช้งานการกำหนดเส้นทาง proxy ของ OpenClaw:

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

- proxy ช่วยเพิ่มความครอบคลุมสำหรับไคลเอนต์ HTTP และ WebSocket ของ JavaScript ภายในกระบวนการ แต่ไม่ใช่ sandbox เครือข่ายระดับ OS
- ทราฟฟิกระนาบควบคุม loopback ของ Gateway มีค่าเริ่มต้นเป็นการข้ามผ่านท้องถิ่นโดยตรงผ่าน `proxy.loopbackMode: "gateway-only"` OpenClaw ใช้การข้ามผ่านนั้นโดยลงทะเบียนอำนาจ loopback ของ Gateway ที่ใช้งานอยู่ในตัวควบคุม `NO_PROXY` ของ `global-agent` ที่จัดการไว้ ผู้ปฏิบัติงานสามารถตั้ง `proxy.loopbackMode: "proxy"` เพื่อส่งทราฟฟิก loopback ของ Gateway ผ่าน proxy ที่จัดการไว้ หรือ `proxy.loopbackMode: "block"` เพื่อปฏิเสธการเชื่อมต่อ Gateway แบบ loopback ดู [โหมด Loopback ของ Gateway](#gateway-loopback-mode) สำหรับข้อควรระวังเกี่ยวกับ proxy ระยะไกล
- ซ็อกเก็ต `net`, `tls` และ `http2` แบบ raw, native addons และกระบวนการลูกที่ไม่ใช่ OpenClaw อาจข้ามการกำหนดเส้นทาง proxy ระดับ Node เว้นแต่ว่าจะสืบทอดและเคารพตัวแปรสภาพแวดล้อม proxy CLI ลูกของ OpenClaw ที่ fork แล้วจะสืบทอด URL proxy ที่จัดการไว้และสถานะ `proxy.loopbackMode`
- IRC เป็นช่อง TCP/TLS แบบ raw ที่อยู่นอกการกำหนดเส้นทาง forward proxy ที่ผู้ปฏิบัติงานจัดการ ในการปรับใช้ที่กำหนดให้ออกสู่ภายนอกทั้งหมดผ่าน forward proxy นั้น ให้ตั้ง `channels.irc.enabled=false` เว้นแต่ว่าการออกสู่ภายนอกของ IRC โดยตรงได้รับการอนุมัติอย่างชัดเจน
- proxy ดีบักภายในเครื่องเป็นเครื่องมือวินิจฉัย และการส่งต่อ upstream โดยตรงสำหรับคำขอ proxy และอุโมงค์ CONNECT จะถูกปิดใช้งานโดยค่าเริ่มต้นขณะที่โหมด proxy ที่จัดการไว้ทำงานอยู่ เปิดใช้งานการส่งต่อโดยตรงเฉพาะสำหรับการวินิจฉัยภายในเครื่องที่ได้รับอนุมัติแล้วเท่านั้น
- WebUI ภายในเครื่องของผู้ใช้และเซิร์ฟเวอร์โมเดลภายในเครื่องควรถูกเพิ่มใน allowlist ในนโยบาย proxy ของผู้ปฏิบัติงานเมื่อจำเป็น OpenClaw ไม่เปิดเผยการข้ามผ่านเครือข่ายท้องถิ่นทั่วไปสำหรับสิ่งเหล่านี้
- การข้ามผ่าน proxy ของระนาบควบคุม Gateway ตั้งใจจำกัดไว้เฉพาะ `localhost` และ URL ที่เป็น IP loopback ตามตัวอักษร ใช้ `ws://127.0.0.1:18789`, `ws://[::1]:18789` หรือ `ws://localhost:18789` สำหรับการเชื่อมต่อระนาบควบคุม Gateway ภายในเครื่องโดยตรง; ชื่อโฮสต์อื่นๆ จะถูกกำหนดเส้นทางเหมือนทราฟฟิกที่อิงชื่อโฮสต์ทั่วไป
- OpenClaw ไม่ตรวจสอบ ทดสอบ หรือรับรองนโยบาย proxy ของคุณ
- ให้ถือว่าการเปลี่ยนแปลงนโยบาย proxy เป็นการเปลี่ยนแปลงเชิงปฏิบัติการที่อ่อนไหวด้านความปลอดภัย
