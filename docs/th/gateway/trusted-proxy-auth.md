---
read_when:
    - การใช้งาน OpenClaw หลังพร็อกซีที่รองรับการยืนยันตัวตน
    - การตั้งค่า Pomerium, Caddy หรือ nginx พร้อม OAuth ไว้ด้านหน้า OpenClaw
    - การแก้ไขข้อผิดพลาด WebSocket 1008 ที่ไม่ได้รับอนุญาตในการตั้งค่า reverse proxy
    - การตัดสินใจว่าจะตั้งค่า HSTS และส่วนหัว HTTP เพื่อเพิ่มความปลอดภัยอื่น ๆ ที่ใด
sidebarTitle: Trusted proxy auth
summary: มอบหมายการยืนยันตัวตนของ Gateway ให้กับพร็อกซีย้อนกลับที่เชื่อถือได้ (Pomerium, Caddy, nginx + OAuth)
title: การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้
x-i18n:
    generated_at: "2026-07-12T16:15:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**ฟีเจอร์ที่มีความละเอียดอ่อนด้านความปลอดภัย** โหมดนี้มอบหมายการยืนยันตัวตนทั้งหมดให้พร็อกซีย้อนกลับของคุณ การกำหนดค่าที่ไม่ถูกต้องอาจทำให้ Gateway ของคุณถูกเข้าถึงโดยไม่ได้รับอนุญาต โปรดอ่านหน้านี้อย่างละเอียดก่อนเปิดใช้งาน
</Warning>

## ควรใช้เมื่อใด

- คุณเรียกใช้ OpenClaw หลัง **พร็อกซีที่รับรู้ข้อมูลประจำตัว** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- พร็อกซีของคุณจัดการการยืนยันตัวตนทั้งหมดและส่งข้อมูลประจำตัวผู้ใช้ผ่านส่วนหัว
- คุณอยู่ในสภาพแวดล้อม Kubernetes หรือคอนเทนเนอร์ ซึ่งพร็อกซีเป็นเส้นทางเดียวไปยัง Gateway
- คุณพบข้อผิดพลาด WebSocket `1008 unauthorized` เนื่องจากเบราว์เซอร์ไม่สามารถส่งโทเค็นในเพย์โหลด WS ได้

## ไม่ควรใช้เมื่อใด

- พร็อกซีของคุณไม่ได้ยืนยันตัวตนผู้ใช้ (เป็นเพียงจุดสิ้นสุด TLS หรือตัวกระจายภาระ)
- มีเส้นทางใดก็ตามไปยัง Gateway ที่ข้ามพร็อกซีได้ (ช่องโหว่ของไฟร์วอลล์ การเข้าถึงผ่านเครือข่ายภายใน)
- คุณไม่แน่ใจว่าพร็อกซีลบหรือเขียนทับส่วนหัวที่ส่งต่อต่อมาอย่างถูกต้องหรือไม่
- คุณต้องการเพียงการเข้าถึงส่วนบุคคลสำหรับผู้ใช้คนเดียว (ให้พิจารณา Tailscale Serve + loopback แทน)

## วิธีการทำงาน

<Steps>
  <Step title="พร็อกซียืนยันตัวตนผู้ใช้">
    พร็อกซีย้อนกลับของคุณยืนยันตัวตนผู้ใช้ (OAuth, OIDC, SAML เป็นต้น)
  </Step>
  <Step title="พร็อกซีเพิ่มส่วนหัวข้อมูลประจำตัว">
    พร็อกซีเพิ่มส่วนหัวที่มีข้อมูลประจำตัวผู้ใช้ซึ่งผ่านการยืนยันตัวตนแล้ว (เช่น `x-forwarded-user: nick@example.com`)
  </Step>
  <Step title="Gateway ตรวจสอบแหล่งที่มาที่เชื่อถือได้">
    OpenClaw ตรวจสอบว่าคำขอมาจาก **IP ของพร็อกซีที่เชื่อถือได้** (`gateway.trustedProxies`) และไม่ใช่ที่อยู่ loopback หรือที่อยู่อินเทอร์เฟซภายในเครื่องของ Gateway เอง
  </Step>
  <Step title="Gateway แยกข้อมูลประจำตัว">
    OpenClaw อ่านส่วนหัวที่จำเป็น แล้วอ่านข้อมูลประจำตัวผู้ใช้จากส่วนหัวที่กำหนดค่าไว้
  </Step>
  <Step title="อนุญาต">
    หากทุกอย่างผ่านการตรวจสอบ และผู้ใช้ผ่าน `allowUsers` (เมื่อกำหนดไว้) คำขอจะได้รับอนุญาต
  </Step>
</Steps>

## การกำหนดค่า

```json5
{
  gateway: {
    // การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้คาดว่า IP ต้นทางของพร็อกซีจะไม่ใช่ loopback โดยค่าเริ่มต้น
    bind: "lan",

    // สำคัญอย่างยิ่ง: เพิ่มเฉพาะ IP ของพร็อกซีของคุณที่นี่
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // ส่วนหัวที่มีข้อมูลประจำตัวผู้ใช้ซึ่งผ่านการยืนยันตัวตนแล้ว (จำเป็น)
        userHeader: "x-forwarded-user",

        // ไม่บังคับ: ส่วนหัวที่ต้องมีอยู่ (การตรวจสอบพร็อกซี)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // ไม่บังคับ: จำกัดเฉพาะผู้ใช้ที่ระบุ (ว่าง = อนุญาตทั้งหมด)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // ไม่บังคับ: อนุญาตพร็อกซี loopback บนโฮสต์เดียวกันหลังจากเลือกเปิดใช้อย่างชัดเจน
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**กฎขณะทำงาน ตามลำดับการประเมิน**

1. IP ต้นทางของคำขอต้องตรงกับ `gateway.trustedProxies` (รองรับ CIDR) มิฉะนั้นจะถูกปฏิเสธ (`trusted_proxy_untrusted_source`)
2. คำขอจากต้นทาง loopback (`127.0.0.1`, `::1`) จะถูกปฏิเสธ เว้นแต่ `gateway.auth.trustedProxy.allowLoopback = true` และที่อยู่ loopback นั้นอยู่ใน `trustedProxies` ด้วย (`trusted_proxy_loopback_source`) การตรวจสอบนี้ทำงานก่อนการตรวจสอบส่วนหัว ดังนั้นต้นทาง loopback จะล้มเหลวด้วยเหตุผลนี้ แม้ว่าส่วนหัวที่จำเป็นจะขาดหายไปด้วยก็ตาม
3. ต้นทางที่ไม่ใช่ loopback ซึ่งตรงกับหนึ่งในที่อยู่อินเทอร์เฟซเครือข่ายภายในเครื่องของโฮสต์ Gateway เองจะถูกปฏิเสธเพื่อป้องกันการปลอมแปลง (`trusted_proxy_local_interface_source`) หากการค้นหาอินเทอร์เฟซล้มเหลว คำขอจะถูกปฏิเสธเช่นกัน (`trusted_proxy_local_interface_check_failed`)
4. `requiredHeaders` และ `userHeader` ต้องมีอยู่และไม่เป็นค่าว่าง
5. หาก `allowUsers` ไม่ว่าง ต้องมีผู้ใช้ที่แยกออกมาอยู่ในรายการ

**หลักฐานจากส่วนหัวที่ส่งต่อมาจะมีผลเหนือความเป็น loopback สำหรับการสำรองแบบเชื่อมต่อภายในโดยตรง** หากคำขอมาถึงผ่าน loopback แต่มีส่วนหัว `Forwarded`, ส่วนหัว `X-Forwarded-*` ใด ๆ หรือ `X-Real-IP` หลักฐานดังกล่าวจะทำให้คำขอไม่มีสิทธิ์ใช้การสำรองด้วยรหัสผ่านแบบเชื่อมต่อภายในโดยตรงและการควบคุมด้วยข้อมูลประจำตัวอุปกรณ์ แม้ว่าคำขอยังคงไม่ผ่านการยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้เนื่องจากเป็น loopback ก็ตาม

`allowLoopback` ให้ความเชื่อถือแก่กระบวนการภายในเครื่องบนโฮสต์ Gateway ในระดับเดียวกับพร็อกซีย้อนกลับ เปิดใช้งานเฉพาะเมื่อ Gateway ยังคงถูกไฟร์วอลล์ป้องกันจากการเข้าถึงโดยตรงจากระยะไกล และพร็อกซีภายในเครื่องลบหรือเขียนทับส่วนหัวข้อมูลประจำตัวที่ไคลเอนต์ส่งมา

ไคลเอนต์ภายในของ Gateway ที่ไม่ได้ผ่านพร็อกซีย้อนกลับควรใช้ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ไม่ใช่ส่วนหัวข้อมูลประจำตัวของพร็อกซีที่เชื่อถือได้ การปรับใช้ Control UI ที่ไม่ใช่ loopback ยังคงต้องกำหนด `gateway.controlUi.allowedOrigins` อย่างชัดเจน
</Warning>

### ข้อมูลอ้างอิงการกำหนดค่า

<ParamField path="gateway.trustedProxies" type="string[]" required>
  อาร์เรย์ของที่อยู่ IP พร็อกซี (หรือ CIDR) ที่ให้ความเชื่อถือ คำขอจาก IP อื่นจะถูกปฏิเสธ
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  ต้องเป็น `"trusted-proxy"`
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  ชื่อส่วนหัวที่มีข้อมูลประจำตัวผู้ใช้ซึ่งผ่านการยืนยันตัวตนแล้ว
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  ส่วนหัวเพิ่มเติมที่ต้องมีเพื่อให้คำขอได้รับความเชื่อถือ
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  รายการอนุญาตของข้อมูลประจำตัวผู้ใช้ ค่าว่างหมายถึงอนุญาตผู้ใช้ที่ผ่านการยืนยันตัวตนทั้งหมด
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  การรองรับพร็อกซีย้อนกลับแบบ loopback บนโฮสต์เดียวกันที่ต้องเลือกเปิดใช้งาน
</ParamField>

<Warning>
เปิดใช้ `allowLoopback` เฉพาะเมื่อพร็อกซีย้อนกลับภายในเครื่องเป็นขอบเขตความเชื่อถือที่ตั้งใจไว้ กระบวนการภายในเครื่องใด ๆ ที่เชื่อมต่อกับ Gateway ได้สามารถพยายามส่งส่วนหัวข้อมูลประจำตัวของพร็อกซีได้ ดังนั้นให้จำกัดการเข้าถึง Gateway โดยตรงไว้เป็นส่วนตัวเฉพาะภายในโฮสต์ และกำหนดให้ต้องมีส่วนหัวที่พร็อกซีเป็นเจ้าของ เช่น `x-forwarded-proto` หรือส่วนหัวยืนยันแบบลงนาม หากพร็อกซีของคุณรองรับ
</Warning>

## พฤติกรรมการจับคู่ของ Control UI

เมื่อ `gateway.auth.mode = "trusted-proxy"` ทำงานอยู่และคำขอผ่านการตรวจสอบพร็อกซีที่เชื่อถือได้ เซสชัน WebSocket ของ Control UI จะเชื่อมต่อได้โดยไม่ต้องมีข้อมูลประจำตัวสำหรับการจับคู่อุปกรณ์

ผลกระทบต่อขอบเขตสิทธิ์:

- เซสชัน WebSocket ของ Control UI ที่ไม่มีอุปกรณ์จะเชื่อมต่อได้ แต่โดยค่าเริ่มต้นจะไม่ได้รับขอบเขตสิทธิ์ของผู้ดำเนินการ OpenClaw ล้างรายการขอบเขตสิทธิ์ที่ร้องขอเป็น `[]` เพื่อให้เซสชันที่ไม่ได้ผูกกับอุปกรณ์หรือโทเค็นที่จับคู่และได้รับอนุมัติแล้วไม่สามารถประกาศสิทธิ์ให้ตนเองได้
- หากเมธอดล้มเหลวด้วย `missing scope` หลังเชื่อมต่อ WebSocket สำเร็จ ให้ใช้ HTTPS เพื่อให้เบราว์เซอร์สร้างข้อมูลประจำตัวอุปกรณ์และดำเนินการจับคู่ให้เสร็จสิ้น ดู [HTTP ที่ไม่ปลอดภัยของ Control UI](/th/web/control-ui#insecure-http)
- ใช้เฉพาะกรณีฉุกเฉิน: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` จะคงขอบเขตสิทธิ์ที่ร้องขอไว้แม้ไม่มีข้อมูลประจำตัวอุปกรณ์ นี่เป็นการลดระดับความปลอดภัยอย่างร้ายแรง โปรดย้อนกลับโดยเร็ว ดู [HTTP ที่ไม่ปลอดภัยของ Control UI](/th/web/control-ui#insecure-http)

การจำกัดขอบเขตสิทธิ์โดยพร็อกซีย้อนกลับ: หากพร็อกซีของคุณส่ง `x-openclaw-scopes` ในคำขออัปเกรด WebSocket ของ Control UI OpenClaw จะจำกัดขอบเขตสิทธิ์ของเซสชันให้เป็นส่วนตัดกันระหว่างขอบเขตสิทธิ์ที่ร้องขอกับขอบเขตสิทธิ์ที่ประกาศ ส่วนหัวนี้ไม่ได้มอบขอบเขตสิทธิ์ แต่เพียงจำกัดขอบเขตสิทธิ์ที่เซสชันสามารถมีได้

ผลที่ตามมา:

- การจับคู่ไม่ใช่ด่านหลักสำหรับการเข้าถึง Control UI ในโหมดนี้อีกต่อไป
- นโยบายการยืนยันตัวตนของพร็อกซีย้อนกลับและ `allowUsers` จะกลายเป็นการควบคุมการเข้าถึงที่มีผลจริง
- จำกัดทางเข้าของ Gateway ไว้เฉพาะ IP ของพร็อกซีที่เชื่อถือได้เท่านั้น (`gateway.trustedProxies` + ไฟร์วอลล์)

ไคลเอนต์ WebSocket แบบกำหนดเองไม่ใช่เซสชัน Control UI `gateway.controlUi.dangerouslyDisableDeviceAuth` ไม่ได้มอบขอบเขตสิทธิ์ให้ไคลเอนต์ `client.mode: "backend"` หรือไคลเอนต์ที่มีรูปแบบแบบ CLI ใด ๆ การทำงานอัตโนมัติแบบกำหนดเองควรใช้ข้อมูลประจำตัวอุปกรณ์/การจับคู่ เส้นทางตัวช่วยแบ็กเอนด์สำหรับการเชื่อมต่อภายในโดยตรงที่สงวนไว้ด้วย `client.id: "gateway-client"` หรือ [Plugin RPC ผู้ดูแลระบบผ่าน HTTP](/th/plugins/admin-http-rpc) เมื่อพื้นผิวคำขอ/การตอบกลับแบบ HTTP เหมาะสมกว่า

## ส่วนหัวขอบเขตสิทธิ์ของผู้ดำเนินการ

การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้เป็นโหมด HTTP ที่ **มีข้อมูลประจำตัว** ดังนั้นผู้เรียกสามารถประกาศขอบเขตสิทธิ์ของผู้ดำเนินการเพิ่มเติมได้ด้วย `x-openclaw-scopes` ในคำขอ HTTP API

หมายเหตุ: ขอบเขตสิทธิ์ WebSocket ถูกกำหนดโดยการจับมือของโปรโตคอล Gateway และการผูกข้อมูลประจำตัวอุปกรณ์ ในคำขออัปเกรด WebSocket ของ Control UI `x-openclaw-scopes` เป็นเพียงการจำกัดขอบเขตสิทธิ์ของเซสชันที่เจรจาแล้ว ไม่ใช่การมอบสิทธิ์ ดู [พฤติกรรมการจับคู่ของ Control UI](#control-ui-pairing-behavior)

ตัวอย่าง:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

พฤติกรรม:

- เมื่อมีส่วนหัว OpenClaw จะใช้ชุดขอบเขตสิทธิ์ที่ประกาศ
- เมื่อมีส่วนหัวแต่ค่าว่าง คำขอจะประกาศว่า **ไม่มี** ขอบเขตสิทธิ์ของผู้ดำเนินการ
- เมื่อไม่มีส่วนหัว HTTP API แบบมีข้อมูลประจำตัวตามปกติจะสำรองไปใช้ชุดขอบเขตสิทธิ์เริ่มต้นมาตรฐานของผู้ดำเนินการ (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`)
- **เส้นทาง HTTP ของ Plugin** ที่ยืนยันตัวตนผ่าน Gateway จะมีค่าเริ่มต้นที่แคบกว่า: เมื่อไม่มี `x-openclaw-scopes` ขอบเขตสิทธิ์ขณะทำงานจะสำรองไปใช้เพียง `operator.write`
- คำขอ HTTP ที่มาจากเบราว์เซอร์ยังคงต้องผ่าน `gateway.controlUi.allowedOrigins` (หรือโหมดสำรองด้วยส่วนหัว Host ที่ตั้งใจเปิดใช้) แม้ว่าการยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้จะสำเร็จแล้ว

กฎในทางปฏิบัติ: ส่ง `x-openclaw-scopes` อย่างชัดเจนเมื่อคุณต้องการให้คำขอผ่านพร็อกซีที่เชื่อถือได้มีสิทธิ์แคบกว่าค่าเริ่มต้น หรือเมื่อเส้นทาง Plugin ที่ยืนยันตัวตนผ่าน Gateway ต้องการสิทธิ์ที่สูงกว่าขอบเขตสิทธิ์การเขียน

## การสิ้นสุด TLS และ HSTS

ใช้จุดสิ้นสุด TLS เพียงจุดเดียวและใช้ HSTS ที่จุดนั้น

<Tabs>
  <Tab title="สิ้นสุด TLS ที่พร็อกซี (แนะนำ)">
    เมื่อพร็อกซีย้อนกลับของคุณจัดการ HTTPS สำหรับ `https://control.example.com` ให้ตั้งค่า `Strict-Transport-Security` ที่พร็อกซีสำหรับโดเมนนั้น

    - เหมาะสำหรับการปรับใช้ที่เปิดให้เข้าถึงจากอินเทอร์เน็ต
    - รวมใบรับรองและนโยบายเสริมความแข็งแกร่งของ HTTP ไว้ในที่เดียว
    - OpenClaw สามารถใช้ HTTP ผ่าน loopback หลังพร็อกซีต่อไปได้

    ตัวอย่างค่าส่วนหัว:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="สิ้นสุด TLS ที่ Gateway">
    หาก OpenClaw ให้บริการ HTTPS โดยตรงด้วยตนเอง (ไม่มีพร็อกซีที่สิ้นสุด TLS) ให้ตั้งค่า:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` ยอมรับค่าส่วนหัวแบบสตริง หรือ `false` เพื่อปิดใช้งานอย่างชัดเจน

  </Tab>
</Tabs>

### แนวทางการทยอยเปิดใช้

- เริ่มด้วยอายุสูงสุดที่สั้นก่อน (เช่น `max-age=300`) ระหว่างตรวจสอบการรับส่งข้อมูล
- เพิ่มเป็นค่าระยะยาว (เช่น `max-age=31536000`) เฉพาะเมื่อมีความมั่นใจสูงแล้ว
- เพิ่ม `includeSubDomains` เฉพาะเมื่อทุกโดเมนย่อยพร้อมใช้งาน HTTPS
- ใช้ preload เฉพาะเมื่อคุณตั้งใจปฏิบัติตามข้อกำหนดของ preload สำหรับชุดโดเมนทั้งหมดของคุณ
- การพัฒนาภายในเครื่องที่ใช้เฉพาะ loopback ไม่ได้รับประโยชน์จาก HSTS

## ตัวอย่างการตั้งค่าพร็อกซี

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium ส่งข้อมูลประจำตัวผ่าน `x-pomerium-claim-email` (หรือส่วนหัวการอ้างสิทธิ์อื่น ๆ) และส่ง JWT ผ่าน `x-pomerium-jwt-assertion`

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP ของ Pomerium
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    ส่วนย่อยการกำหนดค่า Pomerium:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy พร้อม OAuth">
    Caddy พร้อม Plugin `caddy-security` สามารถยืนยันตัวตนผู้ใช้และส่งส่วนหัวข้อมูลประจำตัวได้

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP ของพร็อกซี Caddy/sidecar
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    ตัวอย่างย่อ Caddyfile:

    ```caddy
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy ยืนยันตัวตนผู้ใช้และส่งข้อมูลประจำตัวผ่าน `x-auth-request-email`

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP ของ nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    ตัวอย่างย่อการกำหนดค่า nginx:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik พร้อมการยืนยันตัวตนแบบส่งต่อ">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP คอนเทนเนอร์ Traefik
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่าโทเค็นแบบผสม

การเริ่มต้น Gateway จะปฏิเสธการยืนยันตัวตนแบบพร็อกซีที่เชื่อถือ หากมีการกำหนดค่าโทเค็นที่ใช้ร่วมกันไว้ด้วย (`gateway.auth.token` หรือ `OPENCLAW_GATEWAY_TOKEN`) ทั้งสองแบบใช้ร่วมกันไม่ได้ เนื่องจากโทเค็นที่ใช้ร่วมกันจะทำให้ผู้เรียกจากโฮสต์เดียวกันสามารถยืนยันตัวตนผ่านเส้นทางที่แตกต่างโดยสิ้นเชิงจากข้อมูลประจำตัวที่พร็อกซีตรวจสอบแล้ว ซึ่งโหมดนี้มีไว้เพื่อบังคับใช้

หากการเริ่มต้นล้มเหลวพร้อมข้อผิดพลาด เช่น `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- นำโทเค็นที่ใช้ร่วมกันออกเมื่อใช้โหมดพร็อกซีที่เชื่อถือ หรือ
- เปลี่ยน `gateway.auth.mode` เป็น `"token"` หากคุณต้องการใช้การยืนยันตัวตนด้วยโทเค็น

เฮดเดอร์ข้อมูลประจำตัวจากพร็อกซีที่เชื่อถือผ่าน local loopback ยังคงปฏิเสธโดยปริยาย: ผู้เรียกจากโฮสต์เดียวกันจะไม่ถูกยืนยันตัวตนเป็นผู้ใช้พร็อกซีโดยอัตโนมัติ ผู้เรียกภายใน OpenClaw ที่ข้ามพร็อกซีสามารถยืนยันตัวตนด้วย `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แทนได้ การใช้โทเค็นเป็นทางเลือกสำรองยังคงไม่รองรับโดยเจตนาในโหมดพร็อกซีที่เชื่อถือ

## รายการตรวจสอบความปลอดภัย

ก่อนเปิดใช้การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือ ให้ตรวจสอบว่า:

- [ ] **พร็อกซีเป็นเส้นทางเดียวเท่านั้น**: พอร์ต Gateway ถูกไฟร์วอลล์ไม่ให้สิ่งใดเข้าถึง ยกเว้นพร็อกซีของคุณ
- [ ] **trustedProxies มีเท่าที่จำเป็น**: ระบุเฉพาะ IP ของพร็อกซีจริง ไม่ใช่ทั้งซับเน็ต
- [ ] **แหล่งที่มาของพร็อกซีผ่าน local loopback ถูกกำหนดโดยเจตนา**: การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือจะปฏิเสธคำขอที่มาจาก local loopback โดยปริยาย เว้นแต่จะเปิดใช้ `gateway.auth.trustedProxy.allowLoopback` อย่างชัดเจนสำหรับพร็อกซีบนโฮสต์เดียวกัน
- [ ] **พร็อกซีลบเฮดเดอร์เดิม**: พร็อกซีของคุณเขียนทับ (ไม่ใช่ต่อท้าย) เฮดเดอร์ `x-forwarded-*` จากไคลเอนต์
- [ ] **การสิ้นสุด TLS**: พร็อกซีของคุณจัดการ TLS และผู้ใช้เชื่อมต่อผ่าน HTTPS
- [ ] **กำหนด allowedOrigins อย่างชัดเจน**: Control UI ที่ไม่ผ่าน local loopback ใช้ `gateway.controlUi.allowedOrigins` ที่กำหนดไว้อย่างชัดเจน
- [ ] **กำหนด allowUsers แล้ว** (แนะนำ): จำกัดเฉพาะผู้ใช้ที่รู้จัก แทนการอนุญาตทุกคนที่ผ่านการยืนยันตัวตน
- [ ] **ไม่มีการกำหนดค่าโทเค็นแบบผสม**: อย่ากำหนดทั้ง `gateway.auth.token` และ `gateway.auth.mode: "trusted-proxy"`
- [ ] **รหัสผ่านสำรองภายในเครื่องเป็นข้อมูลส่วนตัว**: หากคุณกำหนด `gateway.auth.password` สำหรับผู้เรียกภายในที่เชื่อมต่อโดยตรง ให้ไฟร์วอลล์พอร์ต Gateway เพื่อไม่ให้ไคลเอนต์ระยะไกลที่ไม่ผ่านพร็อกซีเข้าถึงโดยตรงได้

## การตรวจสอบความปลอดภัย

`openclaw security audit` รายงานการยืนยันตัวตนแบบพร็อกซีที่เชื่อถือเป็นข้อค้นพบระดับ **วิกฤต** ซึ่งเป็นพฤติกรรมโดยเจตนา เพื่อเตือนว่าคุณกำลังมอบหมายความปลอดภัยให้กับการตั้งค่าพร็อกซีของคุณ

การตรวจสอบจะตรวจหา:

- คำเตือน/ข้อความเตือนระดับวิกฤตพื้นฐาน `gateway.trusted_proxy_auth`
- การไม่กำหนดค่า `trustedProxies`
- การไม่กำหนดค่า `userHeader`
- `allowUsers` ว่างเปล่า (อนุญาตผู้ใช้ทุกคนที่ผ่านการยืนยันตัวตน)
- การเปิดใช้ `allowLoopback` สำหรับแหล่งที่มาของพร็อกซีบนโฮสต์เดียวกัน

ข้อค้นพบอื่นที่แยกต่างหากและไม่จำเพาะต่อพร็อกซีที่เชื่อถือจะมีผลด้วยทุกครั้งที่เปิดให้เข้าถึง Control UI ได้แก่ `gateway.controlUi.allowedOrigins` ที่เป็นไวลด์การ์ดหรือไม่ได้กำหนด และการใช้เฮดเดอร์ Host เป็นทางเลือกสำรองสำหรับต้นทาง

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    คำขอไม่ได้มาจาก IP ใน `gateway.trustedProxies` ตรวจสอบว่า:

    - IP ของพร็อกซีถูกต้องหรือไม่ (IP ของคอนเทนเนอร์ Docker อาจเปลี่ยนแปลงได้)
    - มีโหลดบาลานเซอร์อยู่หน้าพร็อกซีของคุณหรือไม่
    - ใช้ `docker inspect` หรือ `kubectl get pods -o wide` เพื่อค้นหา IP จริง

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ปฏิเสธคำขอพร็อกซีที่เชื่อถือซึ่งมาจาก local loopback

    ตรวจสอบว่า:

    - พร็อกซีกำลังเชื่อมต่อจาก `127.0.0.1` / `::1` หรือไม่
    - คุณกำลังพยายามใช้การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือกับรีเวิร์สพร็อกซีผ่าน local loopback บนโฮสต์เดียวกันหรือไม่

    วิธีแก้ไข:

    - ควรใช้การยืนยันตัวตนด้วยโทเค็น/รหัสผ่านสำหรับไคลเอนต์ภายในบนโฮสต์เดียวกันที่ไม่ได้ผ่านพร็อกซี หรือ
    - กำหนดเส้นทางผ่านที่อยู่พร็อกซีที่เชื่อถือซึ่งไม่ใช่ local loopback และเก็บ IP นั้นไว้ใน `gateway.trustedProxies` หรือ
    - สำหรับรีเวิร์สพร็อกซีบนโฮสต์เดียวกันที่ตั้งใจใช้งาน ให้กำหนด `gateway.auth.trustedProxy.allowLoopback = true` เก็บที่อยู่ local loopback ไว้ใน `gateway.trustedProxies` และตรวจสอบให้แน่ใจว่าพร็อกซีลบหรือเขียนทับเฮดเดอร์ข้อมูลประจำตัว

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    IP ต้นทางของคำขอตรงกับหนึ่งในที่อยู่อินเทอร์เฟซเครือข่ายที่ไม่ใช่ local loopback ของโฮสต์ Gateway เอง (ไม่ใช่พร็อกซี) ซึ่งเป็นกลไกป้องกันทราฟฟิกจากโฮสต์เดียวกันที่ปลอมแปลงบน tailnet หรือเครือข่ายบริดจ์ Docker ส่วน `..._check_failed` หมายความว่าการค้นหาอินเทอร์เฟซเกิดข้อผิดพลาด ดังนั้น OpenClaw จึงปฏิเสธโดยปริยาย

    ตรวจสอบว่า:

    - มีกระบวนการบนโฮสต์ Gateway เองที่ส่งเฮดเดอร์ข้อมูลประจำตัวโดยตรงและข้ามพร็อกซีหรือไม่
    - พร็อกซีทำงานในเนมสเปซเครือข่ายเดียวกับ Gateway โดยใช้ IP ที่ปรากฏเป็นอินเทอร์เฟซภายในเครื่องด้วยหรือไม่

    วิธีแก้ไข: กำหนดเส้นทางทราฟฟิกพร็อกซีผ่านที่อยู่ซึ่งไม่ได้ผูกอยู่ภายในโฮสต์ Gateway ด้วย หรือใช้ `allowLoopback` เฉพาะกับการตั้งค่าพร็อกซีบนโฮสต์เดียวกันจริง ๆ เท่านั้น

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    เฮดเดอร์ผู้ใช้ว่างเปล่าหรือไม่มีอยู่ ตรวจสอบว่า:

    - พร็อกซีของคุณได้รับการกำหนดค่าให้ส่งเฮดเดอร์ข้อมูลประจำตัวหรือไม่
    - ชื่อเฮดเดอร์ถูกต้องหรือไม่ (ไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่ แต่การสะกดต้องถูกต้อง)
    - ผู้ใช้ผ่านการยืนยันตัวตนที่พร็อกซีจริงหรือไม่

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    ไม่มีเฮดเดอร์ที่จำเป็น ตรวจสอบว่า:

    - การกำหนดค่าพร็อกซีของคุณระบุเฮดเดอร์เหล่านั้นอย่างถูกต้อง
    - เฮดเดอร์ถูกลบออกที่จุดใดจุดหนึ่งในสายการเชื่อมต่อหรือไม่

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    ผู้ใช้ผ่านการยืนยันตัวตนแล้ว แต่ไม่อยู่ใน `allowUsers` ให้เพิ่มผู้ใช้ดังกล่าวหรือนำรายการอนุญาตออก
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` เป็น `"trusted-proxy"` แต่ `gateway.trustedProxies` ว่างเปล่า หรือไม่มี `gateway.auth.trustedProxy` ทุกคำขอจะถูกปฏิเสธจนกว่าจะกำหนดค่าทั้งสองรายการ
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือสำเร็จแล้ว แต่เฮดเดอร์ `Origin` ของเบราว์เซอร์ไม่ผ่านการตรวจสอบต้นทางของ Control UI

    ตรวจสอบว่า:

    - `gateway.controlUi.allowedOrigins` มีต้นทางของเบราว์เซอร์ที่ตรงกันทุกประการ
    - คุณไม่ได้ใช้ต้นทางแบบไวลด์การ์ด เว้นแต่ตั้งใจอนุญาตทั้งหมด
    - หากตั้งใจใช้โหมดทางเลือกสำรองจากเฮดเดอร์ Host ให้ตรวจสอบว่ากำหนด `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` โดยเจตนา

  </Accordion>
  <Accordion title="เชื่อมต่อสำเร็จ แต่วิธีการต่าง ๆ รายงานว่าไม่มีขอบเขตสิทธิ์">
    WebSocket เชื่อมต่อสำเร็จ แต่ `chat.history`, `sessions.list` หรือ
    `models.list` ล้มเหลวพร้อมข้อความ `missing scope: operator.read`

    สาเหตุที่พบบ่อย:

    - เซสชัน Control UI ที่ไม่มีอุปกรณ์: การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือสามารถอนุญาตการเชื่อมต่อ WebSocket โดยไม่มีข้อมูลประจำตัวของอุปกรณ์ได้ แต่ OpenClaw จะล้างขอบเขตสิทธิ์ของเซสชันที่ไม่มีอุปกรณ์ตามการออกแบบ
    - ไคลเอนต์แบ็กเอนด์แบบกำหนดเอง: `gateway.controlUi.dangerouslyDisableDeviceAuth` มีขอบเขตเฉพาะ Control UI และไม่ได้มอบขอบเขตสิทธิ์ให้ไคลเอนต์ WebSocket แบ็กเอนด์หรือไคลเอนต์รูปแบบ CLI ทั่วไป
    - `x-openclaw-scopes` แคบเกินไป: หากพร็อกซีของคุณแทรกเฮดเดอร์นี้ในคำขออัปเกรด WebSocket ของ Control UI ขอบเขตสิทธิ์ของเซสชันจะถูกจำกัดไว้ที่ชุดดังกล่าว ค่าเฮดเดอร์ว่างเปล่าจะทำให้ไม่มีขอบเขตสิทธิ์

    วิธีแก้ไข:

    - สำหรับ Control UI ให้ใช้ HTTPS เพื่อให้เบราว์เซอร์สามารถสร้างข้อมูลประจำตัวของอุปกรณ์และจับคู่ให้เสร็จสมบูรณ์
    - สำหรับระบบอัตโนมัติแบบกำหนดเอง ให้ใช้ข้อมูลประจำตัวของอุปกรณ์/การจับคู่ เส้นทางตัวช่วยแบ็กเอนด์ `gateway-client` ที่สงวนไว้สำหรับการเชื่อมต่อโดยตรงภายในเครื่อง หรือ [RPC HTTP สำหรับผู้ดูแลระบบ](/th/plugins/admin-http-rpc)
    - ใช้ `gateway.controlUi.dangerouslyDisableDeviceAuth: true` เป็นเส้นทางฉุกเฉินชั่วคราวสำหรับ Control UI เท่านั้น

  </Accordion>
  <Accordion title="WebSocket ยังคงล้มเหลว">
    ตรวจสอบให้แน่ใจว่าพร็อกซีของคุณ:

    - รองรับการอัปเกรด WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
    - ส่งเฮดเดอร์ข้อมูลประจำตัวในคำขออัปเกรด WebSocket (ไม่ใช่เฉพาะ HTTP)
    - ไม่มีเส้นทางการยืนยันตัวตนแยกต่างหากสำหรับการเชื่อมต่อ WebSocket

  </Accordion>
</AccordionGroup>

## การย้ายจากการยืนยันตัวตนด้วยโทเค็น

<Steps>
  <Step title="กำหนดค่าพร็อกซี">
    กำหนดค่าพร็อกซีของคุณให้ยืนยันตัวตนผู้ใช้และส่งเฮดเดอร์
  </Step>
  <Step title="ทดสอบพร็อกซีแยกต่างหาก">
    ทดสอบการตั้งค่าพร็อกซีแยกต่างหาก (`curl` พร้อมเฮดเดอร์)
  </Step>
  <Step title="อัปเดตการกำหนดค่า OpenClaw">
    อัปเดตการกำหนดค่า OpenClaw ให้ใช้การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือ
  </Step>
  <Step title="เริ่ม Gateway ใหม่">
    เริ่ม Gateway ใหม่
  </Step>
  <Step title="ทดสอบ WebSocket">
    ทดสอบการเชื่อมต่อ WebSocket จาก Control UI
  </Step>
  <Step title="ตรวจสอบ">
    เรียกใช้ `openclaw security audit` และตรวจทานข้อค้นพบ
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration) — เอกสารอ้างอิงการกำหนดค่า
- [ขอบเขตสิทธิ์ของผู้ดำเนินการ](/th/gateway/operator-scopes) — บทบาท ขอบเขตสิทธิ์ และการตรวจสอบการอนุมัติ
- [การเข้าถึงจากระยะไกล](/th/gateway/remote) — รูปแบบการเข้าถึงจากระยะไกลอื่น ๆ
- [ความปลอดภัย](/th/gateway/security) — คู่มือความปลอดภัยฉบับเต็ม
- [Tailscale](/th/gateway/tailscale) — ทางเลือกที่ง่ายกว่าสำหรับการเข้าถึงเฉพาะผ่าน tailnet
