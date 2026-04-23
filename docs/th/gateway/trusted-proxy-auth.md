---
read_when:
    - การรัน OpenClaw หลังพร็อกซีที่รับรู้ตัวตน
    - การตั้งค่า Pomerium, Caddy หรือ nginx พร้อม OAuth ไว้หน้า OpenClaw
    - การแก้ไขข้อผิดพลาด WebSocket 1008 unauthorized กับการตั้งค่า reverse proxy
    - การตัดสินใจว่าจะตั้งค่า HSTS และ HTTP hardening headers อื่น ๆ ที่ใด
summary: มอบหมายการยืนยันตัวตนของ Gateway ให้กับ reverse proxy ที่เชื่อถือได้ (Pomerium, Caddy, nginx + OAuth)
title: Trusted Proxy Auth
x-i18n:
    generated_at: "2026-04-23T10:18:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy Auth

> ⚠️ **ฟีเจอร์ที่มีความอ่อนไหวด้านความปลอดภัย** โหมดนี้มอบหมายการยืนยันตัวตนให้ reverse proxy ของคุณทั้งหมด การกำหนดค่าที่ผิดพลาดอาจทำให้ Gateway ของคุณถูกเข้าถึงโดยไม่ได้รับอนุญาต อ่านหน้านี้อย่างละเอียดก่อนเปิดใช้งาน

## ใช้เมื่อใด

ใช้โหมด auth `trusted-proxy` เมื่อ:

- คุณรัน OpenClaw หลัง **พร็อกซีที่รับรู้ตัวตน** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- พร็อกซีของคุณจัดการการยืนยันตัวตนทั้งหมดและส่งตัวตนผู้ใช้ผ่าน headers
- คุณอยู่ในสภาพแวดล้อม Kubernetes หรือ container ที่พร็อกซีเป็นเส้นทางเดียวไปยัง Gateway
- คุณกำลังเจอข้อผิดพลาด WebSocket `1008 unauthorized` เพราะเบราว์เซอร์ไม่สามารถส่งโทเค็นใน payload ของ WS ได้

## ไม่ควรใช้เมื่อใด

- หากพร็อกซีของคุณไม่ได้ยืนยันตัวตนผู้ใช้ (เป็นแค่ตัวปิดปลาย TLS หรือ load balancer)
- หากมีเส้นทางใดไปยัง Gateway ที่ข้ามพร็อกซีได้ (ช่องโหว่ไฟร์วอลล์, การเข้าถึงเครือข่ายภายใน)
- หากคุณไม่แน่ใจว่าพร็อกซีของคุณลบ/เขียนทับ forwarded headers อย่างถูกต้องหรือไม่
- หากคุณต้องการเพียงการเข้าถึงส่วนตัวแบบผู้ใช้คนเดียว (พิจารณา Tailscale Serve + loopback สำหรับการตั้งค่าที่ง่ายกว่า)

## วิธีการทำงาน

1. reverse proxy ของคุณยืนยันตัวตนผู้ใช้ (OAuth, OIDC, SAML ฯลฯ)
2. พร็อกซีเพิ่ม header ที่มีตัวตนของผู้ใช้ที่ยืนยันแล้ว (เช่น `x-forwarded-user: nick@example.com`)
3. OpenClaw ตรวจสอบว่าคำขอมาจาก **IP ของ trusted proxy** (กำหนดค่าใน `gateway.trustedProxies`)
4. OpenClaw ดึงตัวตนผู้ใช้จาก header ที่กำหนดค่าไว้
5. หากทุกอย่างถูกต้อง คำขอจะได้รับอนุญาต

## พฤติกรรมการ Pairing ของ Control UI

เมื่อ `gateway.auth.mode = "trusted-proxy"` ทำงานอยู่และคำขอผ่าน
การตรวจสอบ trusted-proxy, เซสชัน WebSocket ของ Control UI จะเชื่อมต่อได้โดยไม่ต้องใช้
ตัวตนอุปกรณ์จาก pairing

ผลกระทบ:

- Pairing จะไม่ใช่เกตหลักสำหรับการเข้าถึง Control UI ในโหมดนี้อีกต่อไป
- นโยบาย auth ของ reverse proxy และ `allowUsers` จะกลายเป็นตัวควบคุมการเข้าถึงที่มีผลจริง
- คงการล็อก ingress ของ gateway ให้ยอมรับเฉพาะ IP ของ trusted proxy เท่านั้น (`gateway.trustedProxies` + firewall)

## การกำหนดค่า

```json5
{
  gateway: {
    // auth แบบ trusted-proxy คาดหวังคำขอจากแหล่ง trusted proxy ที่ไม่ใช่ loopback
    bind: "lan",

    // สำคัญมาก: ใส่เฉพาะ IP ของพร็อกซีของคุณที่นี่เท่านั้น
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header ที่มีตัวตนผู้ใช้ที่ยืนยันแล้ว (จำเป็น)
        userHeader: "x-forwarded-user",

        // ไม่บังคับ: headers ที่ต้องมีอยู่เสมอ (ยืนยันพร็อกซี)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // ไม่บังคับ: จำกัดเฉพาะผู้ใช้ที่กำหนด (ว่าง = อนุญาตทั้งหมด)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

กฎสำคัญในรันไทม์:

- auth แบบ trusted-proxy จะปฏิเสธคำขอที่มาจาก loopback (`127.0.0.1`, `::1`, loopback CIDRs)
- reverse proxy แบบ loopback บนโฮสต์เดียวกัน **ไม่** ผ่านเกณฑ์ของ auth แบบ trusted-proxy
- สำหรับการตั้งค่าพร็อกซี loopback บนโฮสต์เดียวกัน ให้ใช้ auth แบบ token/password แทน หรือกำหนดเส้นทางผ่านที่อยู่ trusted proxy ที่ไม่ใช่ loopback ซึ่ง OpenClaw ตรวจสอบได้
- การปรับใช้ Control UI ที่ไม่ใช่ loopback ยังคงต้องใช้ `gateway.controlUi.allowedOrigins` แบบชัดเจน
- **หลักฐานจาก forwarded-header มีผลเหนือความเป็น loopback ในเครื่อง** หากคำขอมาถึงบน loopback แต่มี headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` ที่ชี้ไปยังต้นทางที่ไม่ใช่ local หลักฐานนั้นจะทำให้ข้ออ้างว่าเป็น loopback ใช้ไม่ได้ คำขอจะถูกถือว่าเป็น remote สำหรับ pairing, auth แบบ trusted-proxy และการจำกัดตัวตนอุปกรณ์ของ Control UI วิธีนี้ป้องกันไม่ให้พร็อกซี loopback บนโฮสต์เดียวกันฟอกตัวตนจาก forwarded-header ให้กลายเป็น auth แบบ trusted-proxy

### เอกสารอ้างอิงการกำหนดค่า

| Field                                       | Required | Description                                                                 |
| ------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Yes      | รายการ IP ของพร็อกซีที่เชื่อถือได้ คำขอจาก IP อื่นจะถูกปฏิเสธ |
| `gateway.auth.mode`                         | Yes      | ต้องเป็น `"trusted-proxy"`                                                   |
| `gateway.auth.trustedProxy.userHeader`      | Yes      | ชื่อ header ที่มีตัวตนผู้ใช้ที่ยืนยันแล้ว                      |
| `gateway.auth.trustedProxy.requiredHeaders` | No       | headers เพิ่มเติมที่ต้องมีอยู่เพื่อให้เชื่อถือคำขอนั้นได้       |
| `gateway.auth.trustedProxy.allowUsers`      | No       | allowlist ของตัวตนผู้ใช้ ค่าว่างหมายถึงอนุญาตผู้ใช้ที่ยืนยันแล้วทุกคน    |

## การปิดปลาย TLS และ HSTS

ใช้จุดปิดปลาย TLS เพียงจุดเดียวและตั้งค่า HSTS ที่จุดนั้น

### รูปแบบที่แนะนำ: พร็อกซีเป็นจุดปิดปลาย TLS

เมื่อ reverse proxy ของคุณจัดการ HTTPS สำหรับ `https://control.example.com` ให้ตั้ง
`Strict-Transport-Security` ที่พร็อกซีสำหรับโดเมนนั้น

- เหมาะกับการปรับใช้ที่เปิดสู่อินเทอร์เน็ต
- ทำให้นโยบาย certificate + HTTP hardening อยู่ในที่เดียว
- OpenClaw สามารถใช้ loopback HTTP หลังพร็อกซีได้

ค่าของ header ตัวอย่าง:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway เป็นจุดปิดปลาย TLS

หาก OpenClaw ให้บริการ HTTPS โดยตรงเอง (ไม่มีพร็อกซีที่ปิดปลาย TLS) ให้ตั้งค่า:

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

### แนวทางการทยอยใช้งาน

- เริ่มด้วย max age ที่สั้นก่อน (เช่น `max-age=300`) ระหว่างตรวจสอบทราฟฟิก
- เพิ่มเป็นค่าที่ยาวนาน (เช่น `max-age=31536000`) เมื่อมั่นใจแล้วเท่านั้น
- เพิ่ม `includeSubDomains` เฉพาะเมื่อทุก subdomain พร้อมใช้ HTTPS
- ใช้ preload เฉพาะเมื่อคุณตั้งใจทำตามข้อกำหนด preload สำหรับชุดโดเมนทั้งหมดของคุณ
- การพัฒนาแบบ local ที่ใช้ loopback อย่างเดียวไม่ได้ประโยชน์จาก HSTS

## ตัวอย่างการตั้งค่าพร็อกซี

### Pomerium

Pomerium ส่งตัวตนผ่าน `x-pomerium-claim-email` (หรือ claim header อื่น ๆ) และ JWT ใน `x-pomerium-jwt-assertion`

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

### Caddy พร้อม OAuth

Caddy ที่ใช้ Plugin `caddy-security` สามารถยืนยันตัวตนผู้ใช้และส่ง identity headers ได้

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

### nginx + oauth2-proxy

oauth2-proxy ยืนยันตัวตนผู้ใช้และส่งตัวตนผ่าน `x-auth-request-email`

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

### Traefik พร้อม Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP ของคอนเทนเนอร์ Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## การกำหนดค่า token แบบผสม

OpenClaw จะปฏิเสธการกำหนดค่าที่กำกวมเมื่อทั้ง `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`) และโหมด `trusted-proxy` ทำงานพร้อมกัน การกำหนดค่า token แบบผสมอาจทำให้คำขอจาก loopback ถูกยืนยันตัวตนแบบเงียบ ๆ ด้วยเส้นทาง auth ที่ผิด

หากคุณเห็นข้อผิดพลาด `mixed_trusted_proxy_token` ตอนเริ่มต้น:

- ลบ shared token ออกเมื่อใช้โหมด trusted-proxy หรือ
- เปลี่ยน `gateway.auth.mode` เป็น `"token"` หากคุณตั้งใจใช้ auth แบบ token

auth แบบ trusted-proxy สำหรับ loopback ก็ล้มเหลวแบบปิดเช่นกัน: ผู้เรียกจากโฮสต์เดียวกันต้องส่ง identity headers ที่กำหนดค่าไว้ผ่าน trusted proxy แทนการถูกยืนยันตัวตนแบบเงียบ ๆ

## Header ของขอบเขตสิทธิ์ผู้ปฏิบัติการ

auth แบบ trusted-proxy เป็นโหมด HTTP ที่ **มีตัวตนแนบมากับคำขอ** ดังนั้นผู้เรียก
สามารถประกาศขอบเขตสิทธิ์ผู้ปฏิบัติการผ่าน `x-openclaw-scopes` ได้ตามต้องการ

ตัวอย่าง:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

พฤติกรรม:

- เมื่อมี header นี้ OpenClaw จะใช้ชุด scope ที่ประกาศไว้
- เมื่อมี header นี้แต่ค่าเป็นว่าง คำขอจะประกาศว่า **ไม่มี** ขอบเขตสิทธิ์ผู้ปฏิบัติการ
- เมื่อไม่มี header นี้ API HTTP แบบมีตัวตนแนบมากับคำขอจะ fallback ไปยังชุด scope เริ่มต้นมาตรฐานของผู้ปฏิบัติการ
- **Plugin HTTP routes** ที่ใช้ gateway-auth จะแคบกว่าโดยค่าเริ่มต้น: เมื่อไม่มี `x-openclaw-scopes`, scope ในรันไทม์จะ fallback เป็น `operator.write`
- คำขอ HTTP ที่มาจากเบราว์เซอร์ยังคงต้องผ่าน `gateway.controlUi.allowedOrigins` (หรือโหมด fallback ของ Host-header ที่ตั้งใจใช้) แม้ auth แบบ trusted-proxy จะสำเร็จแล้วก็ตาม

กฎใช้งานจริง:

- ส่ง `x-openclaw-scopes` อย่างชัดเจนเมื่อคุณต้องการให้คำขอแบบ trusted-proxy
  แคบกว่าค่าเริ่มต้น หรือเมื่อ gateway-auth plugin route ต้องการ
  สิทธิ์ที่มากกว่า write scope

## รายการตรวจสอบด้านความปลอดภัย

ก่อนเปิดใช้งาน auth แบบ trusted-proxy ให้ตรวจสอบว่า:

- [ ] **พร็อกซีเป็นเส้นทางเดียว**: พอร์ต Gateway ถูกป้องกันด้วยไฟร์วอลล์จากทุกอย่าง ยกเว้นพร็อกซีของคุณ
- [ ] **trustedProxies มีน้อยที่สุด**: ใส่เฉพาะ IP ของพร็อกซีจริง ๆ ไม่ใช่ทั้ง subnet
- [ ] **ไม่มีแหล่งพร็อกซีแบบ loopback**: auth แบบ trusted-proxy จะล้มเหลวแบบปิดสำหรับคำขอที่มาจาก loopback
- [ ] **พร็อกซีลบ headers**: พร็อกซีของคุณเขียนทับ (ไม่ใช่ต่อท้าย) `x-forwarded-*` headers จากไคลเอนต์
- [ ] **การปิดปลาย TLS**: พร็อกซีของคุณจัดการ TLS; ผู้ใช้เชื่อมต่อผ่าน HTTPS
- [ ] **allowedOrigins ระบุชัดเจน**: Control UI ที่ไม่ใช่ loopback ใช้ `gateway.controlUi.allowedOrigins` แบบชัดเจน
- [ ] **ตั้งค่า allowUsers แล้ว** (แนะนำ): จำกัดเฉพาะผู้ใช้ที่รู้จัก แทนที่จะอนุญาตใครก็ได้ที่ยืนยันตัวตนได้
- [ ] **ไม่มีการกำหนดค่า token แบบผสม**: อย่าตั้งทั้ง `gateway.auth.token` และ `gateway.auth.mode: "trusted-proxy"`

## การตรวจสอบความปลอดภัย

`openclaw security audit` จะตั้งค่าสถานะ auth แบบ trusted-proxy พร้อมผลการตรวจพบระดับ **critical** นี่เป็นสิ่งที่ตั้งใจไว้ — เพื่อเตือนว่าคุณกำลังมอบหมายความปลอดภัยให้กับการตั้งค่าพร็อกซีของคุณ

การตรวจสอบจะเช็กสิ่งต่อไปนี้:

- คำเตือน/การเตือนความจำระดับ critical พื้นฐานของ `gateway.trusted_proxy_auth`
- ไม่มีการกำหนดค่า `trustedProxies`
- ไม่มีการกำหนดค่า `userHeader`
- `allowUsers` ว่าง (อนุญาตผู้ใช้ที่ยืนยันตัวตนแล้วทุกคน)
- นโยบาย browser-origin แบบ wildcard หรือหายไปบนพื้นผิว Control UI ที่เปิดเผย

## การแก้ไขปัญหา

### "trusted_proxy_untrusted_source"

คำขอไม่ได้มาจาก IP ใน `gateway.trustedProxies` ตรวจสอบ:

- IP ของพร็อกซีถูกต้องหรือไม่ (IP ของคอนเทนเนอร์ Docker อาจเปลี่ยนได้)
- มี load balancer อยู่หน้าพร็อกซีของคุณหรือไม่
- ใช้ `docker inspect` หรือ `kubectl get pods -o wide` เพื่อหา IP จริง

### "trusted_proxy_loopback_source"

OpenClaw ปฏิเสธคำขอ trusted-proxy ที่มาจาก loopback

ตรวจสอบ:

- พร็อกซีกำลังเชื่อมต่อมาจาก `127.0.0.1` / `::1` หรือไม่
- คุณกำลังพยายามใช้ auth แบบ trusted-proxy กับ reverse proxy แบบ loopback บนโฮสต์เดียวกันหรือไม่

วิธีแก้:

- ใช้ auth แบบ token/password สำหรับการตั้งค่าพร็อกซี loopback บนโฮสต์เดียวกัน หรือ
- กำหนดเส้นทางผ่านที่อยู่ trusted proxy ที่ไม่ใช่ loopback และคง IP นั้นไว้ใน `gateway.trustedProxies`

### "trusted_proxy_user_missing"

header ผู้ใช้ว่างหรือไม่มีอยู่ ตรวจสอบ:

- พร็อกซีของคุณถูกกำหนดค่าให้ส่ง identity headers หรือไม่
- ชื่อ header ถูกต้องหรือไม่ (ไม่สนตัวพิมพ์เล็กใหญ่ แต่การสะกดสำคัญ)
- ผู้ใช้ยืนยันตัวตนที่พร็อกซีจริงหรือไม่

### "trusted*proxy_missing_header*\*"

required header บางตัวไม่มีอยู่ ตรวจสอบ:

- การกำหนดค่าพร็อกซีของคุณสำหรับ headers เหล่านั้นโดยเฉพาะ
- มีการลบ headers ที่จุดใดจุดหนึ่งในสายโซ่หรือไม่

### "trusted_proxy_user_not_allowed"

ผู้ใช้ยืนยันตัวตนแล้ว แต่ไม่ได้อยู่ใน `allowUsers` ให้เพิ่มผู้ใช้นั้นหรือเอา allowlist ออก

### "trusted_proxy_origin_not_allowed"

auth แบบ trusted-proxy สำเร็จแล้ว แต่ `Origin` header ของเบราว์เซอร์ไม่ผ่านการตรวจสอบ origin ของ Control UI

ตรวจสอบ:

- `gateway.controlUi.allowedOrigins` มี browser origin ที่ตรงกันแบบเป๊ะ
- คุณไม่ได้พึ่งพา wildcard origins เว้นแต่ตั้งใจให้เป็นพฤติกรรมอนุญาตทั้งหมด
- หากคุณตั้งใจใช้โหมด Host-header fallback ให้ตั้ง `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` อย่างชัดเจน

### WebSocket ยังล้มเหลวอยู่

ตรวจสอบให้แน่ใจว่าพร็อกซีของคุณ:

- รองรับการอัปเกรด WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- ส่ง identity headers ไปพร้อมคำขออัปเกรด WebSocket ด้วย (ไม่ใช่เฉพาะ HTTP)
- ไม่มีเส้นทาง auth แยกต่างหากสำหรับการเชื่อมต่อ WebSocket

## การย้ายจาก Token Auth

หากคุณกำลังย้ายจาก auth แบบ token ไปเป็น trusted-proxy:

1. กำหนดค่าพร็อกซีของคุณให้ยืนยันตัวตนผู้ใช้และส่ง headers
2. ทดสอบการตั้งค่าพร็อกซีแยกต่างหาก (curl พร้อม headers)
3. อัปเดตคอนฟิก OpenClaw ด้วย auth แบบ trusted-proxy
4. รีสตาร์ต Gateway
5. ทดสอบการเชื่อมต่อ WebSocket จาก Control UI
6. รัน `openclaw security audit` และตรวจทานผลการตรวจพบ

## ที่เกี่ยวข้อง

- [Security](/th/gateway/security) — คู่มือความปลอดภัยฉบับเต็ม
- [Configuration](/th/gateway/configuration) — เอกสารอ้างอิงคอนฟิก
- [Remote Access](/th/gateway/remote) — รูปแบบการเข้าถึงจากระยะไกลอื่น ๆ
- [Tailscale](/th/gateway/tailscale) — ทางเลือกที่ง่ายกว่าสำหรับการเข้าถึงภายใน tailnet เท่านั้น
