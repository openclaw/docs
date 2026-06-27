---
read_when:
    - การเรียกใช้ OpenClaw หลังพร็อกซีที่รับรู้ข้อมูลประจำตัว
    - การตั้งค่า Pomerium, Caddy หรือ nginx พร้อม OAuth ไว้หน้า OpenClaw
    - การแก้ไขข้อผิดพลาด WebSocket 1008 ไม่ได้รับอนุญาตกับการตั้งค่าพร็อกซีย้อนกลับ
    - การตัดสินใจว่าจะตั้งค่า HSTS และส่วนหัว HTTP สำหรับการเสริมความแข็งแกร่งอื่น ๆ ที่ใด
sidebarTitle: Trusted proxy auth
summary: มอบหมายการยืนยันตัวตนของ Gateway ให้กับพร็อกซีย้อนกลับที่เชื่อถือได้ (Pomerium, Caddy, nginx + OAuth)
title: การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้
x-i18n:
    generated_at: "2026-06-27T17:40:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**ฟีเจอร์ที่อ่อนไหวด้านความปลอดภัย** โหมดนี้มอบหมายการยืนยันตัวตนทั้งหมดให้รีเวิร์สพร็อกซีของคุณ การกำหนดค่าผิดอาจเปิด Gateway ของคุณให้ถูกเข้าถึงโดยไม่ได้รับอนุญาต อ่านหน้านี้อย่างรอบคอบก่อนเปิดใช้งาน
</Warning>

## ควรใช้เมื่อใด

ใช้โหมด auth `trusted-proxy` เมื่อ:

- คุณรัน OpenClaw อยู่หลัง **พร็อกซีที่รับรู้ตัวตน** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- พร็อกซีของคุณจัดการการยืนยันตัวตนทั้งหมดและส่งตัวตนผู้ใช้ผ่านส่วนหัว
- คุณอยู่ในสภาพแวดล้อม Kubernetes หรือคอนเทนเนอร์ที่พร็อกซีเป็นเส้นทางเดียวไปยัง Gateway
- คุณพบข้อผิดพลาด WebSocket `1008 unauthorized` เพราะเบราว์เซอร์ส่งโทเค็นในเพย์โหลด WS ไม่ได้

## ไม่ควรใช้เมื่อใด

- หากพร็อกซีของคุณไม่ได้ยืนยันตัวตนผู้ใช้ (เป็นเพียงตัวจบ TLS หรือโหลดบาลานเซอร์)
- หากมีเส้นทางใดไปยัง Gateway ที่ข้ามพร็อกซีได้ (ช่องโหว่ไฟร์วอลล์, การเข้าถึงเครือข่ายภายใน)
- หากคุณไม่แน่ใจว่าพร็อกซีของคุณลบ/เขียนทับส่วนหัวที่ถูกส่งต่ออย่างถูกต้องหรือไม่
- หากคุณต้องการเพียงการเข้าถึงส่วนตัวแบบผู้ใช้คนเดียว (พิจารณา Tailscale Serve + loopback เพื่อการตั้งค่าที่ง่ายกว่า)

## วิธีทำงาน

<Steps>
  <Step title="Proxy authenticates the user">
    รีเวิร์สพร็อกซีของคุณยืนยันตัวตนผู้ใช้ (OAuth, OIDC, SAML ฯลฯ)
  </Step>
  <Step title="Proxy adds an identity header">
    พร็อกซีเพิ่มส่วนหัวที่มีตัวตนผู้ใช้ที่ผ่านการยืนยันแล้ว (เช่น `x-forwarded-user: nick@example.com`)
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw ตรวจสอบว่าคำขอมาจาก **IP พร็อกซีที่เชื่อถือได้** (กำหนดค่าใน `gateway.trustedProxies`)
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw ดึงตัวตนผู้ใช้ออกจากส่วนหัวที่กำหนดค่าไว้
  </Step>
  <Step title="Authorize">
    หากทุกอย่างตรวจสอบผ่าน คำขอจะได้รับอนุญาต
  </Step>
</Steps>

## พฤติกรรมการจับคู่ของ Control UI

เมื่อ `gateway.auth.mode = "trusted-proxy"` ทำงานอยู่และคำขอผ่านการตรวจสอบ trusted-proxy เซสชัน WebSocket ของ Control UI สามารถเชื่อมต่อได้โดยไม่ต้องมีตัวตนอุปกรณ์สำหรับการจับคู่

ผลกระทบด้านขอบเขต:

- เซสชัน WebSocket ของ Control UI ที่ไม่มีอุปกรณ์เชื่อมต่อได้ แต่จะไม่ได้รับขอบเขตผู้ปฏิบัติการตามค่าเริ่มต้น OpenClaw ล้างรายการขอบเขตที่ร้องขอเป็น `[]` เพื่อให้เซสชันที่ไม่ได้ผูกกับอุปกรณ์/โทเค็นที่จับคู่และได้รับอนุมัติแล้วไม่สามารถประกาศสิทธิ์เองได้
- หากเมธอดล้มเหลวด้วย `missing scope` หลังจากเชื่อมต่อ WebSocket สำเร็จ ให้ใช้ HTTPS เพื่อให้เบราว์เซอร์สร้างตัวตนอุปกรณ์และจับคู่ให้เสร็จสมบูรณ์ ดู [HTTP ที่ไม่ปลอดภัยของ Control UI](/th/web/control-ui#insecure-http)
- ใช้เฉพาะกรณีฉุกเฉิน: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` จะคงขอบเขตที่ร้องขอไว้แม้ไม่มีตัวตนอุปกรณ์ นี่เป็นการลดระดับความปลอดภัยอย่างรุนแรง ให้ย้อนกลับโดยเร็ว ดู [HTTP ที่ไม่ปลอดภัยของ Control UI](/th/web/control-ui#insecure-http)

การจำกัดขอบเขตโดยรีเวิร์สพร็อกซี:

- หากพร็อกซีของคุณส่ง `x-openclaw-scopes` ในคำขออัปเกรด WebSocket ของ Control UI OpenClaw จะจำกัดขอบเขตเซสชันให้เป็นส่วนร่วมระหว่างขอบเขตที่ร้องขอและขอบเขตที่ประกาศ ส่วนหัวนี้ไม่ได้ให้สิทธิ์ขอบเขต แต่เพียงจำกัดสิ่งที่เซสชันสามารถถือได้ให้แคบลงเท่านั้น

ผลกระทบ:

- การจับคู่ไม่ใช่ด่านหลักสำหรับการเข้าถึง Control UI ในโหมดนี้อีกต่อไป
- นโยบาย auth ของรีเวิร์สพร็อกซีและ `allowUsers` จะกลายเป็นการควบคุมการเข้าถึงที่มีผลจริง
- ล็อกทางเข้า Gateway ให้เหลือเฉพาะ IP พร็อกซีที่เชื่อถือได้เท่านั้น (`gateway.trustedProxies` + ไฟร์วอลล์)

ไคลเอนต์ WebSocket แบบกำหนดเองไม่ใช่เซสชัน Control UI `gateway.controlUi.dangerouslyDisableDeviceAuth` ไม่ได้ให้ขอบเขตแก่ `client.mode: "backend"` ตามอำเภอใจหรือไคลเอนต์ที่มีรูปแบบเหมือน CLI อัตโนมัติแบบกำหนดเองควรใช้ตัวตนอุปกรณ์/การจับคู่, เส้นทางตัวช่วย backend แบบ direct-local ที่สงวนไว้ `client.id: "gateway-client"` หรือ [Plugin admin HTTP RPC](/th/plugins/admin-http-rpc) เมื่อพื้นผิวคำขอ/คำตอบ HTTP เหมาะสมกว่า

## การกำหนดค่า

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**กฎรันไทม์ที่สำคัญ**

- trusted-proxy auth ปฏิเสธคำขอที่มาจากลูปแบ็ก (`127.0.0.1`, `::1`, CIDR ลูปแบ็ก) ตามค่าเริ่มต้น
- รีเวิร์สพร็อกซีลูปแบ็กบนโฮสต์เดียวกัน **ไม่** ผ่าน trusted-proxy auth เว้นแต่คุณจะตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจนและรวมที่อยู่ลูปแบ็กไว้ใน `gateway.trustedProxies`
- `allowLoopback` เชื่อถือกระบวนการภายในเครื่องบนโฮสต์ Gateway ในระดับเดียวกับรีเวิร์สพร็อกซี เปิดใช้เฉพาะเมื่อ Gateway ยังถูกไฟร์วอลล์ป้องกันจากการเข้าถึงระยะไกลโดยตรง และพร็อกซีภายในเครื่องลบหรือเขียนทับส่วนหัวตัวตนที่ไคลเอนต์ส่งมา
- ไคลเอนต์ Gateway ภายในที่ไม่ได้ผ่านรีเวิร์สพร็อกซีควรใช้ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ไม่ใช่ส่วนหัวตัวตน trusted-proxy
- การปรับใช้ Control UI ที่ไม่ใช่ลูปแบ็กยังต้องมี `gateway.controlUi.allowedOrigins` อย่างชัดเจน
- **หลักฐานส่วนหัวที่ถูกส่งต่อจะแทนที่สถานะลูปแบ็กสำหรับ fallback ภายในเครื่องโดยตรง** หากคำขอมาถึงบนลูปแบ็กแต่มีหลักฐานส่วนหัว `Forwarded`, `X-Forwarded-*` ใดๆ หรือ `X-Real-IP` หลักฐานนั้นจะทำให้ fallback รหัสผ่านแบบ local-direct และการกำกับตัวตนอุปกรณ์ใช้ไม่ได้ เมื่อมี `allowLoopback: true` trusted-proxy auth ยังสามารถยอมรับคำขอเป็นคำขอพร็อกซีบนโฮสต์เดียวกันได้ ขณะที่ `requiredHeaders` และ `allowUsers` ยังคงมีผลต่อไป

</Warning>

### อ้างอิงการกำหนดค่า

<ParamField path="gateway.trustedProxies" type="string[]" required>
  อาร์เรย์ของที่อยู่ IP พร็อกซีที่จะเชื่อถือ คำขอจาก IP อื่นจะถูกปฏิเสธ
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  ต้องเป็น `"trusted-proxy"`
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  ชื่อส่วนหัวที่มีตัวตนผู้ใช้ที่ผ่านการยืนยันแล้ว
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  ส่วนหัวเพิ่มเติมที่ต้องมีเพื่อให้คำขอได้รับความเชื่อถือ
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  รายการอนุญาตของตัวตนผู้ใช้ ว่างหมายถึงอนุญาตผู้ใช้ที่ผ่านการยืนยันตัวตนทั้งหมด
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  การรองรับแบบเลือกเปิดสำหรับรีเวิร์สพร็อกซีลูปแบ็กบนโฮสต์เดียวกัน ค่าเริ่มต้นคือ `false`
</ParamField>

<Warning>
เปิดใช้ `allowLoopback` เฉพาะเมื่อรีเวิร์สพร็อกซีภายในเครื่องคือขอบเขตความเชื่อถือที่ตั้งใจไว้ กระบวนการภายในเครื่องใดๆ ที่เชื่อมต่อกับ Gateway ได้สามารถพยายามส่งส่วนหัวตัวตนพร็อกซีได้ ดังนั้นให้การเข้าถึง Gateway โดยตรงเป็นส่วนตัวเฉพาะกับโฮสต์ และกำหนดให้มีส่วนหัวที่พร็อกซีเป็นเจ้าของ เช่น `x-forwarded-proto` หรือส่วนหัว assertion ที่ลงนามแล้วในกรณีที่พร็อกซีของคุณรองรับ
</Warning>

## การสิ้นสุด TLS และ HSTS

ใช้จุดสิ้นสุด TLS จุดเดียวและใช้ HSTS ที่จุดนั้น

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    เมื่อรีเวิร์สพร็อกซีของคุณจัดการ HTTPS สำหรับ `https://control.example.com` ให้ตั้งค่า `Strict-Transport-Security` ที่พร็อกซีสำหรับโดเมนนั้น

    - เหมาะสำหรับการปรับใช้ที่เปิดสู่ internet
    - เก็บใบรับรอง + นโยบายการเสริมความแข็งแรง HTTP ไว้ในที่เดียว
    - OpenClaw สามารถอยู่บน HTTP ลูปแบ็กหลังพร็อกซีได้

    ตัวอย่างค่าส่วนหัว:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    หาก OpenClaw ให้บริการ HTTPS โดยตรงเอง (ไม่มีพร็อกซีที่สิ้นสุด TLS) ให้ตั้งค่า:

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

    `strictTransportSecurity` รับค่าส่วนหัวแบบสตริง หรือ `false` เพื่อปิดใช้อย่างชัดเจน

  </Tab>
</Tabs>

### คำแนะนำการเปิดใช้เป็นระยะ

- เริ่มด้วยค่า max age สั้นก่อน (เช่น `max-age=300`) ระหว่างตรวจสอบทราฟฟิก
- เพิ่มเป็นค่าที่มีอายุยาว (เช่น `max-age=31536000`) เฉพาะหลังจากมีความมั่นใจสูงแล้ว
- เพิ่ม `includeSubDomains` เฉพาะเมื่อทุกซับโดเมนพร้อมใช้ HTTPS
- ใช้ preload เฉพาะเมื่อคุณตั้งใจทำตามข้อกำหนด preload สำหรับชุดโดเมนทั้งหมดของคุณ
- การพัฒนาภายในเครื่องแบบลูปแบ็กเท่านั้นไม่ได้รับประโยชน์จาก HSTS

## ตัวอย่างการตั้งค่าพร็อกซี

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium ส่งตัวตนใน `x-pomerium-claim-email` (หรือส่วนหัว claim อื่น) และ JWT ใน `x-pomerium-jwt-assertion`

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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
  <Accordion title="Caddy with OAuth">
    Caddy พร้อม Plugin `caddy-security` สามารถยืนยันตัวตนผู้ใช้และส่งส่วนหัวตัวตนได้

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    ส่วนย่อย Caddyfile:

    ```
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
    oauth2-proxy ยืนยันตัวตนผู้ใช้และส่งตัวตนใน `x-auth-request-email`

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    ส่วนย่อยการกำหนดค่า nginx:

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
  <Accordion title="Traefik with forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

OpenClaw ปฏิเสธการกำหนดค่าที่กำกวมซึ่งทั้ง `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`) และโหมด `trusted-proxy` ทำงานพร้อมกัน การกำหนดค่าโทเค็นแบบผสมอาจทำให้คำขอลูปแบ็กยืนยันตัวตนบนเส้นทาง auth ที่ผิดโดยไม่แสดงอาการ

หากคุณเห็นข้อผิดพลาด `mixed_trusted_proxy_token` ตอนเริ่มต้น:

- ลบโทเค็นที่ใช้ร่วมกันเมื่อใช้โหมด trusted-proxy หรือ
- เปลี่ยน `gateway.auth.mode` เป็น `"token"` หากคุณตั้งใจใช้ auth แบบโทเค็น

ส่วนหัวระบุตัวตน trusted-proxy ของ loopback ยังคงปฏิเสธโดยปริยาย: ผู้เรียกจากโฮสต์เดียวกันจะไม่ถูกตรวจสอบสิทธิ์เป็นผู้ใช้ proxy แบบเงียบ ๆ ผู้เรียกภายในของ OpenClaw ที่ข้าม proxy อาจตรวจสอบสิทธิ์ด้วย `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แทนได้ การ fallback ไปใช้โทเค็นยังคงไม่รองรับโดยเจตนาในโหมด trusted-proxy

## ส่วนหัวขอบเขต operator

การตรวจสอบสิทธิ์ trusted-proxy เป็นโหมด HTTP แบบ **มีข้อมูลระบุตัวตน** ดังนั้นผู้เรียกอาจประกาศขอบเขต operator ด้วย `x-openclaw-scopes` ในคำขอ HTTP API ได้ตามต้องการ

หมายเหตุ: ขอบเขต WebSocket ถูกกำหนดโดย handshake ของโปรโตคอล Gateway และการผูกข้อมูลระบุตัวตนของอุปกรณ์ ในคำขออัปเกรด WebSocket ของ Control UI นั้น `x-openclaw-scopes` เป็นเพียงเพดานจำกัดขอบเขตของเซสชันที่เจรจาแล้ว ไม่ใช่การให้สิทธิ์ สำหรับพฤติกรรมขอบเขต WebSocket กับ trusted-proxy ดู [พฤติกรรมการจับคู่ของ Control UI](#control-ui-pairing-behavior)

ตัวอย่าง:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

พฤติกรรม:

- เมื่อมีส่วนหัวนี้ OpenClaw จะใช้ชุดขอบเขตที่ประกาศไว้
- เมื่อมีส่วนหัวนี้แต่ค่าว่าง คำขอจะประกาศว่า **ไม่มี** ขอบเขต operator
- เมื่อไม่มีส่วนหัวนี้ HTTP API แบบมีข้อมูลระบุตัวตนตามปกติจะ fallback ไปใช้ชุดขอบเขตเริ่มต้นมาตรฐานของ operator
- **เส้นทาง HTTP ของ Plugin** ที่ใช้การตรวจสอบสิทธิ์ของ Gateway จะแคบกว่าโดยค่าเริ่มต้น: เมื่อไม่มี `x-openclaw-scopes` ขอบเขตรันไทม์จะ fallback ไปเป็น `operator.write`
- คำขอ HTTP จากเบราว์เซอร์ยังต้องผ่าน `gateway.controlUi.allowedOrigins` (หรือโหมด fallback ของส่วนหัว Host โดยเจตนา) แม้การตรวจสอบสิทธิ์ trusted-proxy จะสำเร็จแล้ว
- สำหรับเซสชัน WebSocket ของ Control UI นั้น `x-openclaw-scopes` เป็นเพดานจำกัดขอบเขตเมื่อมีอยู่ในคำขออัปเกรด ค่าว่างจะทำให้ไม่มีขอบเขต

กฎปฏิบัติ: ส่ง `x-openclaw-scopes` อย่างชัดเจนเมื่อคุณต้องการให้คำขอ trusted-proxy แคบกว่าค่าเริ่มต้น หรือเมื่อเส้นทาง Plugin ที่ใช้การตรวจสอบสิทธิ์ของ Gateway ต้องการสิทธิ์ที่สูงกว่าขอบเขต write

## รายการตรวจสอบความปลอดภัย

ก่อนเปิดใช้การตรวจสอบสิทธิ์ trusted-proxy ให้ตรวจสอบว่า:

- [ ] **Proxy เป็นเส้นทางเดียวเท่านั้น**: พอร์ต Gateway ถูก firewall จากทุกอย่างยกเว้น proxy ของคุณ
- [ ] **trustedProxies น้อยที่สุดเท่าที่จำเป็น**: เฉพาะ IP ของ proxy จริงของคุณ ไม่ใช่ subnet ทั้งชุด
- [ ] **แหล่งที่มา proxy แบบ loopback เป็นไปโดยเจตนา**: การตรวจสอบสิทธิ์ trusted-proxy จะปฏิเสธโดยปริยายสำหรับคำขอที่มีแหล่งที่มาแบบ loopback เว้นแต่จะเปิดใช้ `gateway.auth.trustedProxy.allowLoopback` อย่างชัดเจนสำหรับ proxy บนโฮสต์เดียวกัน
- [ ] **Proxy ตัดส่วนหัวออก**: proxy ของคุณเขียนทับ (ไม่ใช่ต่อท้าย) ส่วนหัว `x-forwarded-*` จากไคลเอนต์
- [ ] **การสิ้นสุด TLS**: proxy ของคุณจัดการ TLS; ผู้ใช้เชื่อมต่อผ่าน HTTPS
- [ ] **allowedOrigins ชัดเจน**: Control UI ที่ไม่ใช่ loopback ใช้ `gateway.controlUi.allowedOrigins` อย่างชัดเจน
- [ ] **ตั้งค่า allowUsers แล้ว** (แนะนำ): จำกัดเฉพาะผู้ใช้ที่รู้จัก แทนที่จะอนุญาตทุกคนที่ตรวจสอบสิทธิ์แล้ว
- [ ] **ไม่มี config โทเค็นแบบผสม**: อย่าตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.mode: "trusted-proxy"`
- [ ] **การ fallback ไปใช้รหัสผ่านภายในเป็นส่วนตัว**: หากคุณกำหนดค่า `gateway.auth.password` สำหรับผู้เรียกภายในโดยตรง ให้ firewall พอร์ต Gateway ไว้เพื่อไม่ให้ไคลเอนต์ระยะไกลที่ไม่ผ่าน proxy เข้าถึงโดยตรงได้

## การตรวจสอบความปลอดภัย

`openclaw security audit` จะรายงานการตรวจสอบสิทธิ์ trusted-proxy เป็น finding ระดับความรุนแรง **critical** นี่เป็นพฤติกรรมโดยเจตนา — เป็นการเตือนว่าคุณกำลังมอบหมายความปลอดภัยให้การตั้งค่า proxy ของคุณ

การตรวจสอบจะตรวจหา:

- คำเตือน/การเตือน critical พื้นฐานของ `gateway.trusted_proxy_auth`
- การกำหนดค่า `trustedProxies` ที่ขาดหาย
- การกำหนดค่า `userHeader` ที่ขาดหาย
- `allowUsers` ว่างเปล่า (อนุญาตผู้ใช้ที่ตรวจสอบสิทธิ์แล้วทุกคน)
- เปิดใช้ `allowLoopback` สำหรับแหล่งที่มา proxy บนโฮสต์เดียวกัน
- นโยบาย origin ของเบราว์เซอร์เป็น wildcard หรือขาดหายบนพื้นผิว Control UI ที่เปิดเผย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    คำขอไม่ได้มาจาก IP ใน `gateway.trustedProxies` ตรวจสอบว่า:

    - IP ของ proxy ถูกต้องหรือไม่? (IP ของคอนเทนเนอร์ Docker อาจเปลี่ยนได้)
    - มี load balancer อยู่หน้า proxy ของคุณหรือไม่?
    - ใช้ `docker inspect` หรือ `kubectl get pods -o wide` เพื่อหา IP จริง

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ปฏิเสธคำขอ trusted-proxy ที่มีแหล่งที่มาแบบ loopback

    ตรวจสอบว่า:

    - proxy กำลังเชื่อมต่อจาก `127.0.0.1` / `::1` หรือไม่?
    - คุณกำลังพยายามใช้การตรวจสอบสิทธิ์ trusted-proxy กับ reverse proxy แบบ loopback บนโฮสต์เดียวกันหรือไม่?

    วิธีแก้:

    - แนะนำให้ใช้การตรวจสอบสิทธิ์ด้วยโทเค็น/รหัสผ่านสำหรับไคลเอนต์ภายในบนโฮสต์เดียวกันที่ไม่ได้ผ่าน proxy หรือ
    - ส่งผ่านที่อยู่ proxy ที่เชื่อถือได้ซึ่งไม่ใช่ loopback และเก็บ IP นั้นไว้ใน `gateway.trustedProxies` หรือ
    - สำหรับ reverse proxy บนโฮสต์เดียวกันโดยเจตนา ให้ตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` เก็บที่อยู่ loopback ไว้ใน `gateway.trustedProxies` และตรวจสอบให้แน่ใจว่า proxy ตัดหรือเขียนทับส่วนหัวระบุตัวตน

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    ส่วนหัวผู้ใช้ว่างเปล่าหรือขาดหาย ตรวจสอบว่า:

    - proxy ของคุณถูกกำหนดค่าให้ส่งผ่านส่วนหัวระบุตัวตนหรือไม่?
    - ชื่อส่วนหัวถูกต้องหรือไม่? (ไม่สนตัวพิมพ์เล็กใหญ่ แต่การสะกดสำคัญ)
    - ผู้ใช้ผ่านการตรวจสอบสิทธิ์ที่ proxy จริงหรือไม่?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    ไม่มีส่วนหัวที่จำเป็น ตรวจสอบว่า:

    - การกำหนดค่า proxy ของคุณสำหรับส่วนหัวเฉพาะเหล่านั้น
    - ส่วนหัวถูกตัดออกที่จุดใดในลำดับการส่งต่อหรือไม่

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    ผู้ใช้ผ่านการตรวจสอบสิทธิ์แล้ว แต่ไม่ได้อยู่ใน `allowUsers` ให้เพิ่มผู้ใช้นั้นหรือลบ allowlist ออก
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    การตรวจสอบสิทธิ์ trusted-proxy สำเร็จแล้ว แต่ส่วนหัว `Origin` ของเบราว์เซอร์ไม่ผ่านการตรวจสอบ origin ของ Control UI

    ตรวจสอบว่า:

    - `gateway.controlUi.allowedOrigins` มี origin ของเบราว์เซอร์ที่ตรงกันทุกประการ
    - คุณไม่ได้พึ่งพา origin แบบ wildcard เว้นแต่คุณตั้งใจต้องการพฤติกรรมอนุญาตทั้งหมด
    - หากคุณตั้งใจใช้โหมด fallback ของส่วนหัว Host ให้ตั้งค่า `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` โดยเจตนา

  </Accordion>
  <Accordion title="การเชื่อมต่อสำเร็จ แต่วิธีการรายงานว่าขอบเขตขาดหาย">
    WebSocket เชื่อมต่อได้ แต่ `chat.history`, `sessions.list` หรือ
    `models.list` ล้มเหลวด้วย `missing scope: operator.read`

    สาเหตุทั่วไป:

    - เซสชัน Control UI ที่ไม่มีอุปกรณ์: การตรวจสอบสิทธิ์ trusted-proxy สามารถยอมรับการเชื่อมต่อ WebSocket โดยไม่มีข้อมูลระบุตัวตนของอุปกรณ์ได้ แต่ OpenClaw จะล้างขอบเขตของเซสชันที่ไม่มีอุปกรณ์ตามการออกแบบ
    - ไคลเอนต์ backend แบบกำหนดเอง: `gateway.controlUi.dangerouslyDisableDeviceAuth` จำกัดอยู่ในขอบเขต Control UI และไม่ได้ให้ขอบเขตแก่ไคลเอนต์ WebSocket backend หรือรูปแบบ CLI ใด ๆ ตามอำเภอใจ
    - `x-openclaw-scopes` แคบเกินไป: หาก proxy ของคุณฉีดส่วนหัวนี้ในคำขออัปเกรด WebSocket ของ Control UI ขอบเขตเซสชันจะถูกจำกัดไว้ที่ชุดนั้น ค่าส่วนหัวว่างจะทำให้ไม่มีขอบเขต

    วิธีแก้:

    - สำหรับ Control UI ให้ใช้ HTTPS เพื่อให้เบราว์เซอร์สร้างข้อมูลระบุตัวตนของอุปกรณ์และทำการจับคู่ให้เสร็จสมบูรณ์ได้
    - สำหรับ automation แบบกำหนดเอง ให้ใช้ข้อมูลระบุตัวตนของอุปกรณ์/การจับคู่ เส้นทางตัวช่วย backend แบบ direct-local ที่สงวนไว้ `gateway-client` หรือ [admin HTTP RPC](/th/plugins/admin-http-rpc)
    - ใช้ `gateway.controlUi.dangerouslyDisableDeviceAuth: true` เป็นเส้นทาง break-glass ชั่วคราวสำหรับ Control UI เท่านั้น

  </Accordion>
  <Accordion title="WebSocket ยังล้มเหลว">
    ตรวจสอบให้แน่ใจว่า proxy ของคุณ:

    - รองรับการอัปเกรด WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
    - ส่งผ่านส่วนหัวระบุตัวตนในคำขออัปเกรด WebSocket (ไม่ใช่เฉพาะ HTTP)
    - ไม่มีเส้นทางการตรวจสอบสิทธิ์แยกต่างหากสำหรับการเชื่อมต่อ WebSocket

  </Accordion>
</AccordionGroup>

## การย้ายจากการตรวจสอบสิทธิ์ด้วยโทเค็น

หากคุณกำลังย้ายจากการตรวจสอบสิทธิ์ด้วยโทเค็นไปเป็น trusted-proxy:

<Steps>
  <Step title="กำหนดค่า proxy">
    กำหนดค่า proxy ของคุณเพื่อตรวจสอบสิทธิ์ผู้ใช้และส่งผ่านส่วนหัว
  </Step>
  <Step title="ทดสอบ proxy แยกต่างหาก">
    ทดสอบการตั้งค่า proxy แยกต่างหาก (curl พร้อมส่วนหัว)
  </Step>
  <Step title="อัปเดต config ของ OpenClaw">
    อัปเดต config ของ OpenClaw ด้วยการตรวจสอบสิทธิ์ trusted-proxy
  </Step>
  <Step title="รีสตาร์ท Gateway">
    รีสตาร์ท Gateway
  </Step>
  <Step title="ทดสอบ WebSocket">
    ทดสอบการเชื่อมต่อ WebSocket จาก Control UI
  </Step>
  <Step title="ตรวจสอบ">
    เรียกใช้ `openclaw security audit` และตรวจทาน findings
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration) — เอกสารอ้างอิง config
- [การเข้าถึงระยะไกล](/th/gateway/remote) — รูปแบบการเข้าถึงระยะไกลอื่น ๆ
- [ความปลอดภัย](/th/gateway/security) — คู่มือความปลอดภัยฉบับเต็ม
- [Tailscale](/th/gateway/tailscale) — ทางเลือกที่ง่ายกว่าสำหรับการเข้าถึงเฉพาะ tailnet
