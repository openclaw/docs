---
read_when:
    - การรัน OpenClaw หลัง identity-aware proxy
    - การตั้งค่า Pomerium, Caddy หรือ nginx พร้อม OAuth ไว้หน้า OpenClaw
    - การแก้ไขข้อผิดพลาด WebSocket 1008 unauthorized ในการตั้งค่าแบบ reverse proxy
    - การตัดสินใจว่าจะตั้งค่า HSTS และ HTTP hardening headers อื่น ๆ ที่จุดใด
sidebarTitle: Trusted proxy auth
summary: มอบหมายการยืนยันตัวตนของ gateway ให้กับ reverse proxy ที่เชื่อถือได้ (Pomerium, Caddy, nginx + OAuth)
title: การยืนยันตัวตนผ่าน trusted proxy
x-i18n:
    generated_at: "2026-04-26T11:32:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**ฟีเจอร์ที่มีความอ่อนไหวด้านความปลอดภัย** โหมดนี้จะมอบหมายการยืนยันตัวตนทั้งหมดให้กับ reverse proxy ของคุณโดยสมบูรณ์ การตั้งค่าที่ผิดพลาดอาจทำให้ Gateway ของคุณถูกเข้าถึงโดยไม่ได้รับอนุญาต โปรดอ่านหน้านี้อย่างละเอียดก่อนเปิดใช้งาน
</Warning>

## ใช้เมื่อใด

ใช้โหมด auth แบบ `trusted-proxy` เมื่อ:

- คุณรัน OpenClaw หลัง **identity-aware proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- proxy ของคุณจัดการการยืนยันตัวตนทั้งหมดและส่งต่อ identity ของผู้ใช้ผ่าน header
- คุณอยู่ในสภาพแวดล้อม Kubernetes หรือคอนเทนเนอร์ที่ proxy เป็นเส้นทางเดียวเข้าสู่ Gateway
- คุณเจอข้อผิดพลาด WebSocket `1008 unauthorized` เพราะเบราว์เซอร์ไม่สามารถส่งโทเค็นใน payload ของ WS ได้

## ไม่ควรใช้เมื่อใด

- หาก proxy ของคุณไม่ได้ยืนยันตัวตนผู้ใช้ (เป็นแค่ตัวยุติ TLS หรือ load balancer)
- หากมีเส้นทางใดไปยัง Gateway ที่ข้าม proxy ได้ (ช่องโหว่ใน firewall, การเข้าถึงจากเครือข่ายภายใน)
- หากคุณไม่แน่ใจว่า proxy ของคุณลบ/เขียนทับ forwarded headers ได้ถูกต้องหรือไม่
- หากคุณต้องการเพียงการเข้าถึงส่วนตัวสำหรับผู้ใช้คนเดียว (ลองพิจารณา Tailscale Serve + loopback ซึ่งตั้งค่าง่ายกว่า)

## วิธีการทำงาน

<Steps>
  <Step title="Proxy ยืนยันตัวตนผู้ใช้">
    reverse proxy ของคุณยืนยันตัวตนผู้ใช้ (OAuth, OIDC, SAML ฯลฯ)
  </Step>
  <Step title="Proxy เพิ่ม identity header">
    Proxy เพิ่ม header ที่มี identity ของผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว (เช่น `x-forwarded-user: nick@example.com`)
  </Step>
  <Step title="Gateway ตรวจสอบแหล่งที่เชื่อถือได้">
    OpenClaw ตรวจสอบว่าคำขอมาจาก **IP ของ trusted proxy** (กำหนดค่าใน `gateway.trustedProxies`)
  </Step>
  <Step title="Gateway ดึง identity">
    OpenClaw ดึง identity ของผู้ใช้จาก header ที่กำหนดไว้
  </Step>
  <Step title="Authorize">
    หากทุกอย่างถูกต้อง คำขอนั้นจะได้รับอนุญาต
  </Step>
</Steps>

## พฤติกรรมการจับคู่ของ Control UI

เมื่อ `gateway.auth.mode = "trusted-proxy"` ทำงานอยู่ และคำขอผ่านการตรวจสอบ trusted-proxy แล้ว เซสชัน WebSocket ของ Control UI จะเชื่อมต่อได้โดยไม่ต้องมี identity ของการจับคู่อุปกรณ์

ผลที่ตามมา:

- การจับคู่จะไม่ใช่ด่านหลักสำหรับการเข้าถึง Control UI ในโหมดนี้อีกต่อไป
- นโยบาย auth ของ reverse proxy และ `allowUsers` ของคุณจะกลายเป็นการควบคุมการเข้าถึงที่มีผลจริง
- ต้องล็อก ingress ของ gateway ให้รับได้เฉพาะจาก IP ของ trusted proxy เท่านั้น (`gateway.trustedProxies` + firewall)

## การตั้งค่า

```json5
{
  gateway: {
    // auth แบบ trusted-proxy คาดหวังคำขอจากแหล่ง trusted proxy ที่ไม่ใช่ loopback
    bind: "lan",

    // สำคัญมาก: เพิ่มเฉพาะ IP ของ proxy ของคุณที่นี่เท่านั้น
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header ที่มี identity ของผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว (จำเป็น)
        userHeader: "x-forwarded-user",

        // เลือกได้: headers ที่ต้องมีอยู่เสมอ (การตรวจสอบ proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // เลือกได้: จำกัดเฉพาะผู้ใช้บางราย (ว่าง = อนุญาตทุกคน)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**กฎ runtime ที่สำคัญ**

- auth แบบ trusted-proxy จะปฏิเสธคำขอที่มาจาก loopback (`127.0.0.1`, `::1`, CIDR ของ loopback)
- reverse proxy แบบ loopback ที่อยู่โฮสต์เดียวกัน **ไม่** ผ่านเงื่อนไขของ trusted-proxy auth
- สำหรับการตั้งค่า proxy แบบ loopback บนโฮสต์เดียวกัน ให้ใช้ auth แบบ token/password แทน หรือกำหนดเส้นทางผ่านที่อยู่ trusted proxy ที่ไม่ใช่ loopback ซึ่ง OpenClaw ตรวจสอบได้
- การติดตั้งใช้งาน Control UI ที่ไม่ใช่ loopback ยังคงต้องตั้งค่า `gateway.controlUi.allowedOrigins` แบบชัดเจน
- **หลักฐานจาก forwarded-header มีสิทธิ์เหนือกว่าความเป็น loopback ภายในเครื่อง** หากคำขอมาถึงผ่าน loopback แต่มี header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` ที่ชี้ไปยังต้นทางที่ไม่ใช่ภายในเครื่อง หลักฐานนั้นจะทำให้คำกล่าวอ้างว่าเป็น loopback ใช้ไม่ได้ คำขอนั้นจะถูกถือว่าเป็นคำขอระยะไกลสำหรับการจับคู่, trusted-proxy auth และการควบคุมด้วย device-identity ของ Control UI วิธีนี้ช่วยป้องกันไม่ให้ proxy แบบ loopback บนโฮสต์เดียวกันฟอก forwarded-header identity ให้ผ่าน trusted-proxy auth ได้

</Warning>

### ข้อมูลอ้างอิงการตั้งค่า

<ParamField path="gateway.trustedProxies" type="string[]" required>
  อาร์เรย์ของ IP ของ proxy ที่เชื่อถือได้ คำขอจาก IP อื่นจะถูกปฏิเสธ
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  ต้องเป็น `"trusted-proxy"`
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  ชื่อ header ที่มี identity ของผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  headers เพิ่มเติมที่ต้องมีอยู่เพื่อให้คำขอได้รับความเชื่อถือ
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  allowlist ของ identity ผู้ใช้ หากว่างหมายถึงอนุญาตผู้ใช้ที่ผ่านการยืนยันตัวตนทุกคน
</ParamField>

## การยุติ TLS และ HSTS

ใช้จุดยุติ TLS เพียงจุดเดียว และใช้ HSTS ที่จุดนั้น

<Tabs>
  <Tab title="ยุติ TLS ที่ proxy (แนะนำ)">
    เมื่อ reverse proxy ของคุณจัดการ HTTPS ให้ `https://control.example.com` ให้ตั้ง `Strict-Transport-Security` ที่ proxy สำหรับโดเมนนั้น

    - เหมาะกับการติดตั้งใช้งานที่หันออกสู่อินเทอร์เน็ต
    - ช่วยให้เก็บนโยบาย certificate + HTTP hardening ไว้ในที่เดียว
    - OpenClaw สามารถคงเป็น loopback HTTP หลัง proxy ได้

    ตัวอย่างค่า header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="ยุติ TLS ที่ Gateway">
    หาก OpenClaw ให้บริการ HTTPS โดยตรงเอง (ไม่มี proxy ที่ยุติ TLS) ให้ตั้งค่า:

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

    `strictTransportSecurity` รับค่าเป็นสตริงของ header หรือ `false` เพื่อปิดใช้งานอย่างชัดเจน

  </Tab>
</Tabs>

### แนวทางการทยอยเปิดใช้

- เริ่มจากค่า max age ที่สั้นก่อน (เช่น `max-age=300`) ระหว่างตรวจสอบทราฟฟิก
- เพิ่มเป็นค่าระยะยาว (เช่น `max-age=31536000`) ก็ต่อเมื่อมั่นใจแล้วเท่านั้น
- เพิ่ม `includeSubDomains` ก็ต่อเมื่อทุก subdomain พร้อมใช้ HTTPS แล้ว
- ใช้ preload ก็ต่อเมื่อคุณตั้งใจทำตามข้อกำหนด preload สำหรับชุดโดเมนทั้งหมดของคุณ
- การพัฒนาในเครื่องแบบ loopback-only ไม่ได้ประโยชน์จาก HSTS

## ตัวอย่างการตั้งค่า proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium จะส่ง identity มาใน `x-pomerium-claim-email` (หรือ claim header อื่น) และส่ง JWT มาใน `x-pomerium-jwt-assertion`

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

    ตัวอย่างคอนฟิก Pomerium:

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
    Caddy ที่ใช้ plugin `caddy-security` สามารถยืนยันตัวตนผู้ใช้และส่ง identity header ได้

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP ของ Caddy/sidecar proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    ตัวอย่าง Caddyfile:

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
    oauth2-proxy จะยืนยันตัวตนผู้ใช้และส่ง identity มาใน `x-auth-request-email`

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

    ตัวอย่างคอนฟิก nginx:

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
  <Accordion title="Traefik พร้อม forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP คอนเทนเนอร์ของ Traefik
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

## การตั้งค่า token แบบผสม

OpenClaw จะปฏิเสธการตั้งค่าที่กำกวม เมื่อมีทั้ง `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`) และโหมด `trusted-proxy` ทำงานพร้อมกัน การตั้งค่า token แบบผสมอาจทำให้คำขอ loopback ถูกยืนยันตัวตนแบบเงียบ ๆ ผ่านเส้นทาง auth ที่ผิด

หากคุณเห็นข้อผิดพลาด `mixed_trusted_proxy_token` ตอนเริ่มต้น:

- ให้นำ shared token ออกเมื่อใช้โหมด trusted-proxy หรือ
- เปลี่ยน `gateway.auth.mode` เป็น `"token"` หากคุณตั้งใจใช้ auth แบบ token

trusted-proxy auth สำหรับ loopback ก็จะ fail closed เช่นกัน: ผู้เรียกบนโฮสต์เดียวกันต้องส่ง identity header ที่ตั้งค่าไว้ผ่าน trusted proxy แทนที่จะได้รับการยืนยันตัวตนแบบเงียบ ๆ

## Operator scopes header

trusted-proxy auth เป็นโหมด HTTP แบบ **แบก identity** ดังนั้นผู้เรียกสามารถประกาศ operator scopes ผ่าน `x-openclaw-scopes` ได้แบบเลือกได้

ตัวอย่าง:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

พฤติกรรม:

- เมื่อมี header นี้ OpenClaw จะใช้ชุด scope ที่ประกาศไว้
- เมื่อมี header นี้แต่ค่าว่าง คำขอนั้นจะประกาศว่า **ไม่มี** operator scopes
- เมื่อไม่มี header นี้ API HTTP แบบแบก identity ตามปกติจะ fallback ไปยังชุด scope เริ่มต้นมาตรฐานของ operator
- **เส้นทาง HTTP ของ plugin ที่ใช้ gateway-auth** จะแคบกว่าเป็นค่าเริ่มต้น: เมื่อไม่มี `x-openclaw-scopes` runtime scope ของเส้นทางเหล่านั้นจะ fallback ไปเป็น `operator.write`
- คำขอ HTTP ที่มาจากเบราว์เซอร์ยังคงต้องผ่าน `gateway.controlUi.allowedOrigins` (หรือโหมด fallback ของ Host header ที่ตั้งใจใช้) แม้ trusted-proxy auth จะสำเร็จแล้วก็ตาม

กฎใช้งานจริง: ส่ง `x-openclaw-scopes` อย่างชัดเจนเมื่อคุณต้องการให้คำขอ trusted-proxy แคบกว่าค่าเริ่มต้น หรือเมื่อเส้นทางของ plugin ที่ใช้ gateway-auth ต้องการสิทธิ์ที่สูงกว่า write scope

## รายการตรวจสอบด้านความปลอดภัย

ก่อนเปิดใช้ trusted-proxy auth โปรดยืนยันว่า:

- [ ] **Proxy คือเส้นทางเดียว**: พอร์ตของ Gateway ถูก firewall กันไว้จากทุกอย่าง ยกเว้น proxy ของคุณ
- [ ] **trustedProxies มีขอบเขตน้อยที่สุด**: ใส่เฉพาะ IP ของ proxy จริงของคุณ ไม่ใช่ทั้ง subnet
- [ ] **ไม่มีแหล่ง proxy แบบ loopback**: trusted-proxy auth จะ fail closed สำหรับคำขอที่มาจาก loopback
- [ ] **Proxy ลบ headers**: proxy ของคุณเขียนทับ (ไม่ใช่ append) `x-forwarded-*` headers ที่มาจากไคลเอนต์
- [ ] **การยุติ TLS**: proxy ของคุณจัดการ TLS; ผู้ใช้เชื่อมต่อผ่าน HTTPS
- [ ] **allowedOrigins ถูกตั้งแบบชัดเจน**: Control UI ที่ไม่ใช่ loopback ใช้ `gateway.controlUi.allowedOrigins` แบบชัดเจน
- [ ] **ตั้งค่า allowUsers แล้ว** (แนะนำ): จำกัดเฉพาะผู้ใช้ที่รู้จัก แทนที่จะอนุญาตทุกคนที่ยืนยันตัวตนได้
- [ ] **ไม่มีการตั้งค่า token แบบผสม**: อย่าตั้งทั้ง `gateway.auth.token` และ `gateway.auth.mode: "trusted-proxy"` พร้อมกัน

## Security audit

`openclaw security audit` จะทำเครื่องหมาย trusted-proxy auth เป็นประเด็นระดับ **วิกฤต** โดยตั้งใจ นี่เป็นการเตือนว่าคุณกำลังมอบหมายความปลอดภัยให้กับการตั้งค่า proxy ของคุณ

สิ่งที่ audit ตรวจสอบ:

- คำเตือน/การเตือนระดับวิกฤตพื้นฐาน `gateway.trusted_proxy_auth`
- ไม่มีการตั้งค่า `trustedProxies`
- ไม่มีการตั้งค่า `userHeader`
- `allowUsers` ว่าง (อนุญาตผู้ใช้ที่ยืนยันตัวตนแล้วทุกคน)
- นโยบาย browser-origin แบบ wildcard หรือไม่มีเลยบนพื้นผิว Control UI ที่เปิดเผย

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    คำขอไม่ได้มาจาก IP ที่อยู่ใน `gateway.trustedProxies` ตรวจสอบ:

    - IP ของ proxy ถูกต้องหรือไม่ (IP ของคอนเทนเนอร์ Docker อาจเปลี่ยนได้)
    - มี load balancer อยู่หน้า proxy ของคุณหรือไม่
    - ใช้ `docker inspect` หรือ `kubectl get pods -o wide` เพื่อหา IP จริง

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ปฏิเสธคำขอ trusted-proxy ที่มาจาก loopback

    ตรวจสอบ:

    - proxy เชื่อมต่อมาจาก `127.0.0.1` / `::1` หรือไม่
    - คุณกำลังพยายามใช้ trusted-proxy auth กับ reverse proxy แบบ loopback บนโฮสต์เดียวกันหรือไม่

    วิธีแก้:

    - ใช้ auth แบบ token/password สำหรับการตั้งค่า proxy แบบ loopback บนโฮสต์เดียวกัน หรือ
    - กำหนดเส้นทางผ่านที่อยู่ trusted proxy ที่ไม่ใช่ loopback และเก็บ IP นั้นไว้ใน `gateway.trustedProxies`

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    user header ว่างหรือไม่มี ตรวจสอบ:

    - proxy ของคุณถูกตั้งค่าให้ส่ง identity headers หรือไม่
    - ชื่อ header ถูกต้องหรือไม่ (ไม่สนตัวพิมพ์เล็กใหญ่ แต่การสะกดต้องถูก)
    - ผู้ใช้ได้ผ่านการยืนยันตัวตนที่ proxy จริงหรือไม่

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    ไม่มี required header ที่จำเป็น ตรวจสอบ:

    - การตั้งค่า proxy ของคุณสำหรับ header เหล่านั้นโดยเฉพาะ
    - header ถูกลบออกที่ใดที่หนึ่งใน chain หรือไม่

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    ผู้ใช้ผ่านการยืนยันตัวตนแล้ว แต่ไม่ได้อยู่ใน `allowUsers` ให้เพิ่มผู้ใช้นั้น หรือเอา allowlist ออก
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    trusted-proxy auth สำเร็จแล้ว แต่ header `Origin` ของเบราว์เซอร์ไม่ผ่านการตรวจสอบ origin ของ Control UI

    ตรวจสอบ:

    - `gateway.controlUi.allowedOrigins` มี browser origin ที่ตรงกันแบบเป๊ะ
    - คุณไม่ได้พึ่งพา wildcard origins เว้นแต่ตั้งใจให้เป็นพฤติกรรมอนุญาตทั้งหมด
    - หากคุณตั้งใจใช้โหมด fallback ของ Host header ให้ตรวจสอบว่าได้ตั้ง `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` อย่างตั้งใจแล้ว

  </Accordion>
  <Accordion title="WebSocket ยังล้มเหลวอยู่">
    ตรวจสอบให้แน่ใจว่า proxy ของคุณ:

    - รองรับ WebSocket upgrade (`Upgrade: websocket`, `Connection: upgrade`)
    - ส่งต่อ identity headers บนคำขอ WebSocket upgrade ด้วย (ไม่ใช่แค่ HTTP)
    - ไม่มีเส้นทาง auth แยกต่างหากสำหรับการเชื่อมต่อ WebSocket

  </Accordion>
</AccordionGroup>

## การย้ายจาก auth แบบ token

หากคุณกำลังย้ายจาก auth แบบ token ไปเป็น trusted-proxy:

<Steps>
  <Step title="กำหนดค่า proxy">
    กำหนดค่า proxy ของคุณให้ยืนยันตัวตนผู้ใช้และส่งผ่าน headers
  </Step>
  <Step title="ทดสอบ proxy แยกต่างหาก">
    ทดสอบการตั้งค่า proxy แยกต่างหาก (curl พร้อม headers)
  </Step>
  <Step title="อัปเดตคอนฟิก OpenClaw">
    อัปเดตคอนฟิก OpenClaw ให้ใช้ trusted-proxy auth
  </Step>
  <Step title="รีสตาร์ต Gateway">
    รีสตาร์ต Gateway
  </Step>
  <Step title="ทดสอบ WebSocket">
    ทดสอบการเชื่อมต่อ WebSocket จาก Control UI
  </Step>
  <Step title="ทำ Audit">
    รัน `openclaw security audit` และตรวจสอบผลการตรวจพบ
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [การตั้งค่า](/th/gateway/configuration) — ข้อมูลอ้างอิงคอนฟิก
- [การเข้าถึงระยะไกล](/th/gateway/remote) — รูปแบบการเข้าถึงระยะไกลอื่น ๆ
- [ความปลอดภัย](/th/gateway/security) — คู่มือความปลอดภัยฉบับเต็ม
- [Tailscale](/th/gateway/tailscale) — ทางเลือกที่ง่ายกว่าสำหรับการเข้าถึงแบบ tailnet-only
