---
read_when:
    - กำลังทำงานกับฟีเจอร์ของช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการตั้งค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T10:14:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "จงละทิ้งความหวังทั้งปวงเสีย ท่านผู้ก้าวเข้ามาที่นี่"

สถานะ: รองรับข้อความตัวอักษร + ไฟล์แนบใน DM; การส่งไฟล์ในช่องทาง/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats)) แบบสำรวจจะถูกส่งผ่าน Adaptive Cards การดำเนินการกับข้อความจะแสดง `upload-file` แบบชัดเจนสำหรับการส่งที่เริ่มจากไฟล์

## Plugin ที่มากับระบบ

Microsoft Teams มาพร้อมเป็น Plugin ที่รวมมากับระบบใน OpenClaw รุ่นปัจจุบัน ดังนั้นในการติดตั้งแบบแพ็กเกจตามปกติจึงไม่ต้องติดตั้งแยก

หากคุณใช้รุ่นเก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Teams มา ให้ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install @openclaw/msteams
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. สร้าง **Azure Bot** (App ID + client secret + tenant ID)
3. ตั้งค่า OpenClaw ด้วยข้อมูลรับรองเหล่านั้น
4. เปิดเผย `/api/messages` (พอร์ต 3978 โดยค่าเริ่มต้น) ผ่าน URL สาธารณะหรือ tunnel
5. ติดตั้งแพ็กเกจแอป Teams และเริ่ม Gateway

การตั้งค่าขั้นต่ำ (client secret):

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

สำหรับการนำไปใช้จริงในระบบ production ให้พิจารณาใช้ [การยืนยันตัวตนแบบ federated](#federated-authentication-certificate--managed-identity) (certificate หรือ managed identity) แทน client secret

หมายเหตุ: แชทกลุ่มจะถูกบล็อกโดยค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตให้ตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` (หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน โดยยังคงต้องมีการ mention เป็นเงื่อนไข)

## เป้าหมาย

- สนทนากับ OpenClaw ผ่าน Teams DM, แชทกลุ่ม หรือช่องทาง
- ทำให้การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: การตอบกลับจะกลับไปยังช่องทางที่ข้อความมาถึงเสมอ
- ใช้พฤติกรรมช่องทางที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องมีการ mention เว้นแต่จะตั้งค่าไว้เป็นอย่างอื่น)

## การเขียนค่าตั้งค่า

โดยค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดตค่าตั้งค่าที่ถูกกระตุ้นโดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดได้ด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่คงที่
- UPN/ชื่อที่แสดงสามารถเปลี่ยนได้; การจับคู่โดยตรงถูกปิดไว้โดยค่าเริ่มต้น และจะเปิดใช้เมื่อกำหนด `channels.msteams.dangerouslyAllowNameMatching: true` เท่านั้น
- วิซาร์ดสามารถ resolve ชื่อให้เป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลรับรองอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อก เว้นแต่คุณจะเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นนี้เมื่อไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งใดสามารถกระตุ้นการทำงานในแชทกลุ่ม/ช่องทางได้ (สำรองไปใช้ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (โดยค่าเริ่มต้นยังคงต้องมีการ mention)
- หากต้องการ **ไม่อนุญาตช่องทางใดเลย** ให้ตั้ง `channels.msteams.groupPolicy: "disabled"`

ตัวอย่าง:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlist ของช่องทาง**

- กำหนดขอบเขตการตอบกลับในกลุ่ม/ช่องทางโดยระบุ teams และ channels ภายใต้ `channels.msteams.teams`
- คีย์ควรใช้ team ID และ channel conversation ID ที่คงที่
- เมื่อ `groupPolicy="allowlist"` และมี teams allowlist อยู่ จะยอมรับเฉพาะ teams/channels ที่อยู่ในรายการเท่านั้น (โดยต้องมีการ mention เป็นเงื่อนไข)
- วิซาร์ดการตั้งค่ารองรับรายการแบบ `Team/Channel` และจะจัดเก็บให้คุณ
- ตอนเริ่มต้น OpenClaw จะ resolve ชื่อ team/channel และชื่อผู้ใช้ใน allowlist ให้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping ไว้ในล็อก; ชื่อ team/channel ที่ resolve ไม่ได้จะคงไว้ตามที่พิมพ์ แต่จะถูกเพิกเฉยสำหรับการกำหนดเส้นทางโดยค่าเริ่มต้น เว้นแต่จะเปิดใช้ `channels.msteams.dangerouslyAllowNameMatching: true`

ตัวอย่าง:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## วิธีการทำงาน

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอตและรวมสิทธิ์ RSC ด้านล่างไว้ด้วย
4. อัปโหลด/ติดตั้งแอป Teams ลงในทีม (หรือขอบเขตแบบ personal สำหรับ DM)
5. ตั้งค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือ env vars) แล้วเริ่ม Gateway
6. Gateway จะรับทราฟฟิก webhook ของ Bot Framework ที่ `/api/messages` โดยค่าเริ่มต้น

## การตั้งค่า Azure Bot (ข้อกำหนดเบื้องต้น)

ก่อนตั้งค่า OpenClaw คุณต้องสร้างทรัพยากร Azure Bot ก่อน

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือก Azure subscription ของคุณ                           |
   | **Resource group** | สร้างใหม่หรือใช้ของเดิม                               |
   | **Pricing tier**   | **Free** สำหรับงานพัฒนา/การทดสอบ                                 |
   | **Type of App**    | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **ประกาศการเลิกใช้:** การสร้างบอต multi-tenant ใหม่ถูกเลิกใช้หลังวันที่ 2025-07-31 โปรดใช้ **Single Tenant** สำหรับบอตใหม่

3. คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลรับรอง

1. ไปที่ทรัพยากร Azure Bot ของคุณ → **Configuration**
2. คัดลอก **Microsoft App ID** → นี่คือ `appId` ของคุณ
3. คลิก **Manage Password** → ไปที่ App Registration
4. ภายใต้ **Certificates & secrets** → **New client secret** → คัดลอก **Value** → นี่คือ `appPassword` ของคุณ
5. ไปที่ **Overview** → คัดลอก **Directory (tenant) ID** → นี่คือ `tenantId` ของคุณ

### ขั้นตอนที่ 3: ตั้งค่า Messaging Endpoint

1. ใน Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint** เป็น URL webhook ของคุณ:
   - Production: `https://your-domain.com/api/messages`
   - การพัฒนาในเครื่อง: ใช้ tunnel (ดู [การพัฒนาในเครื่อง](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้ช่องทาง Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

<a id="federated-authentication-certificate--managed-identity"></a>

## การยืนยันตัวตนแบบ Federated (Certificate + Managed Identity)

> เพิ่มใน 2026.3.24

สำหรับการนำไปใช้จริงในระบบ production OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่าการใช้ client secret โดยมีให้เลือกสองวิธี:

### ตัวเลือก A: การยืนยันตัวตนด้วย certificate

ใช้ certificate แบบ PEM ที่ลงทะเบียนกับ app registration ของ Entra ID ของคุณ

**การตั้งค่า:**

1. สร้างหรือจัดหา certificate (รูปแบบ PEM พร้อม private key)
2. ใน Entra ID → App Registration → **Certificates & secrets** → **Certificates** → อัปโหลด public certificate

**การตั้งค่า:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### ตัวเลือก B: Azure Managed Identity

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน ซึ่งเหมาะอย่างยิ่งสำหรับการนำไปใช้บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity ให้ใช้งาน

**วิธีการทำงาน:**

1. pod/VM ของบอตมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity เข้ากับ app registration ของ Entra ID
3. ระหว่างรัน OpenClaw จะใช้ `@azure/identity` เพื่อขอรับโทเค็นจาก Azure IMDS endpoint (`169.254.169.254`)
4. โทเค็นจะถูกส่งไปยัง Teams SDK เพื่อใช้ยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- มีการสร้าง federated identity credential บน app registration ของ Entra ID
- pod/VM สามารถเข้าถึงเครือข่ายไปยัง IMDS (`169.254.169.254:80`) ได้

**การตั้งค่า (system-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**การตั้งค่า (user-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะกรณี user-assigned)

### การตั้งค่า AKS Workload Identity

สำหรับการนำไปใช้บน AKS ที่ใช้ workload identity:

1. **เปิดใช้ workload identity** บนคลัสเตอร์ AKS ของคุณ
2. **สร้าง federated identity credential** บน app registration ของ Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **ใส่ annotation ให้ Kubernetes service account** ด้วย app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **ติด label ให้ pod** สำหรับการฉีด workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้แน่ใจว่าสามารถเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) ได้ — หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | ตั้งค่าง่าย                       | ต้องหมุนเวียน secret และปลอดภัยน้อยกว่า |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ไม่มี shared secret ผ่านเครือข่าย      | มีภาระในการจัดการ certificate       |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่าน และไม่ต้องจัดการ secrets | ต้องใช้โครงสร้างพื้นฐาน Azure         |

**พฤติกรรมค่าเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนด้วย client secret โดยค่าเริ่มต้น การตั้งค่าที่มีอยู่เดิมยังคงทำงานต่อได้โดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (Tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ tunnel สำหรับการพัฒนาในเครื่อง:

**ตัวเลือก A: ngrok**

```bash
ngrok http 3978
# คัดลอก URL https เช่น https://abc123.ngrok.io
# ตั้งค่า messaging endpoint เป็น: https://abc123.ngrok.io/api/messages
```

**ตัวเลือก B: Tailscale Funnel**

```bash
tailscale funnel 3978
# ใช้ URL ของ Tailscale funnel ของคุณเป็น messaging endpoint
```

## Teams Developer Portal (ทางเลือก)

แทนที่จะสร้างไฟล์ ZIP ของ manifest ด้วยตนเอง คุณสามารถใช้ [Teams Developer Portal](https://dev.teams.microsoft.com/apps) ได้:

1. คลิก **+ New app**
2. กรอกข้อมูลพื้นฐาน (ชื่อ คำอธิบาย ข้อมูลผู้พัฒนา)
3. ไปที่ **App features** → **Bot**
4. เลือก **Enter a bot ID manually** แล้ววาง Azure Bot App ID ของคุณ
5. เลือกขอบเขต: **Personal**, **Team**, **Group Chat**
6. คลิก **Distribute** → **Download app package**
7. ใน Teams: **Apps** → **Manage your apps** → **Upload a custom app** → เลือกไฟล์ ZIP

วิธีนี้มักง่ายกว่าการแก้ไข JSON manifest ด้วยตนเอง

## การทดสอบบอต

**ตัวเลือก A: Azure Web Chat (ตรวจสอบ webhook ก่อน)**

1. ใน Azure Portal → ทรัพยากร Azure Bot ของคุณ → **Test in Web Chat**
2. ส่งข้อความหนึ่งข้อความ - คุณควรเห็นการตอบกลับ
3. สิ่งนี้ยืนยันว่า endpoint ของ webhook ของคุณทำงานก่อนเริ่มตั้งค่า Teams

**ตัวเลือก B: Teams (หลังติดตั้งแอปแล้ว)**

1. ติดตั้งแอป Teams (sideload หรือ org catalog)
2. ค้นหาบอตใน Teams แล้วส่ง DM
3. ตรวจสอบล็อก Gateway เพื่อดู activity ขาเข้า

## การตั้งค่า (ขั้นต่ำแบบข้อความล้วน)

1. **ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน**
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเอง:
     - จาก npm: `openclaw plugins install @openclaw/msteams`
     - จาก local checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **การลงทะเบียนบอต**
   - สร้าง Azure Bot (ดูด้านบน) และจดข้อมูลต่อไปนี้:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Teams app manifest**
   - ใส่รายการ `bot` โดยมี `botId = <App ID>`
   - ขอบเขต: `personal`, `team`, `groupChat`
   - `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขต personal)
   - เพิ่มสิทธิ์ RSC (ด้านล่าง)
   - สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
   - บีบอัดทั้งสามไฟล์รวมกัน: `manifest.json`, `outline.png`, `color.png`

4. **ตั้งค่า OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   คุณยังสามารถใช้ environment variables แทนคีย์ในค่าตั้งค่าได้:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ user-assigned MI)

5. **Bot endpoint**
   - ตั้ง Azure Bot Messaging Endpoint เป็น:
     - `https://<host>:3978/api/messages` (หรือ path/port ที่คุณเลือก)

6. **รัน Gateway**
   - ช่องทาง Teams จะเริ่มทำงานอัตโนมัติเมื่อมี Plugin ที่รวมมากับระบบหรือติดตั้งด้วยตนเอง และมีค่าตั้งค่า `msteams` พร้อมข้อมูลรับรอง

## การดำเนินการข้อมูลสมาชิก

OpenClaw แสดงการดำเนินการ `member-info` ที่ขับเคลื่อนด้วย Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถ resolve รายละเอียดสมาชิกของช่องทาง (ชื่อที่แสดง อีเมล บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อมการอนุมัติจากผู้ดูแลระบบ

การดำเนินการนี้ถูกควบคุมโดย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้เมื่อมีข้อมูลรับรอง Graph พร้อมใช้งาน)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความช่องทาง/กลุ่มล่าสุดที่จะถูกครอบเข้าไปใน prompt
- สำรองไปใช้ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองด้วย allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการป้อนบริบทเธรดเริ่มต้นจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่ถูกอ้างอิง (`ReplyTo*` ที่ได้มาจาก HTML การตอบกลับของ Teams) ปัจจุบันจะถูกส่งต่อไปตามที่ได้รับ
- กล่าวอีกนัยหนึ่ง allowlist ใช้ควบคุมว่าใครสามารถกระตุ้นเอเจนต์ได้; ปัจจุบันมีการกรองเฉพาะเส้นทางบริบทเสริมบางประเภทเท่านั้น
- ประวัติ DM สามารถจำกัดได้ด้วย `channels.msteams.dmHistoryLimit` (จำนวนรอบของผู้ใช้) การแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ปัจจุบันของ Teams (Manifest)

ต่อไปนี้คือ **resourceSpecific permissions** ที่มีอยู่ใน Teams app manifest ของเราในปัจจุบัน โดยมีผลเฉพาะภายในทีม/แชทที่ติดตั้งแอปเท่านั้น

**สำหรับช่องทาง (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความช่องทางทั้งหมดได้โดยไม่ต้องมี @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับแชทกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความแชทกลุ่มทั้งหมดได้โดยไม่ต้องมี @mention

## ตัวอย่าง Teams Manifest (ปกปิดข้อมูลแล้ว)

ตัวอย่างขั้นต่ำที่ถูกต้องพร้อมฟิลด์ที่จำเป็น แทนที่ IDs และ URLs ตามต้องการ

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### ข้อควรระวังของ manifest (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง** ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง** ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวมพื้นผิวที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- `bots[].supportsFiles: true` จำเป็นสำหรับการจัดการไฟล์ในขอบเขต personal
- `authorization.permissions.resourceSpecific` ต้องรวมสิทธิ์อ่าน/ส่งของช่องทาง หากคุณต้องการทราฟฟิกจากช่องทาง

### การอัปเดตแอปที่มีอยู่แล้ว

หากต้องการอัปเดตแอป Teams ที่ติดตั้งอยู่แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัดไฟล์ใหม่** พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลดไฟล์ zip ใหม่:
   - **ตัวเลือก A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → ค้นหาแอปของคุณ → Upload new version
   - **ตัวเลือก B (Sideload):** ใน Teams → Apps → Manage your apps → Upload a custom app
5. **สำหรับช่องทางของทีม:** ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล
6. **ปิด Teams ให้หมดแล้วเปิดใหม่อีกครั้ง** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างข้อมูลเมทาดาทาของแอปที่แคชไว้

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อมี **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว ไม่มีสิทธิ์ Graph API)

ใช้งานได้:

- อ่านเนื้อหา **ข้อความตัวอักษร** ในช่องทาง
- ส่งเนื้อหา **ข้อความตัวอักษร** ไปยังช่องทาง
- รับไฟล์แนบใน **personal (DM)**

ใช้งานไม่ได้:

- **เนื้อหารูปภาพหรือไฟล์** ในช่องทาง/กลุ่ม (payload จะมีเฉพาะ HTML stub)
- ดาวน์โหลดไฟล์แนบที่เก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจากอีเวนต์ webhook แบบสด)

### เมื่อมี **Teams RSC + สิทธิ์ Microsoft Graph Application**

จะเพิ่มความสามารถดังนี้:

- ดาวน์โหลด hosted contents (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่เก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความของช่องทาง/แชทผ่าน Graph

### RSC เทียบกับ Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | ได้ (ผ่าน webhook)    | ไม่ได้ (ได้เฉพาะ polling)                   |
| **Historical messages** | ไม่ได้                   | ได้ (สามารถค้นประวัติ)             |
| **Setup complexity**    | เฉพาะ app manifest    | ต้องมีการอนุมัติจากผู้ดูแลระบบ + token flow |
| **Works offline**       | ไม่ได้ (ต้องกำลังรันอยู่) | ได้ (ค้นได้ทุกเมื่อ)                 |

**สรุป:** RSC ใช้สำหรับการรับฟังแบบเรียลไทม์; Graph API ใช้สำหรับการเข้าถึงข้อมูลย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไประหว่างออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องได้รับการอนุมัติจากผู้ดูแลระบบ)

## สื่อ + ประวัติที่เปิดใช้ Graph (จำเป็นสำหรับช่องทาง)

หากคุณต้องการรูปภาพ/ไฟล์ใน **ช่องทาง** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ผู้ดูแลระบบอนุมัติ

1. ใน **App Registration** ของ Entra ID (Azure AD) ให้เพิ่มสิทธิ์ Microsoft Graph แบบ **Application**:
   - `ChannelMessage.Read.All` (ไฟล์แนบในช่องทาง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชทกลุ่ม)
2. **Grant admin consent** ให้กับ tenant
3. เพิ่มค่า **manifest version** ของแอป Teams อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ปิด Teams ให้หมดแล้วเปิดใหม่อีกครั้ง** เพื่อล้างข้อมูลเมทาดาทาของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการ mention ผู้ใช้:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ที่อยู่ในการสนทนาอยู่แล้ว อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้แบบไดนามิกที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ผู้ดูแลระบบอนุมัติ

## ข้อจำกัดที่ทราบ

### Webhook timeouts

Teams ส่งข้อความผ่าน HTTP webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับจาก LLM ช้า) คุณอาจพบว่า:

- Gateway หมดเวลา
- Teams พยายามส่งข้อความซ้ำ (ทำให้เกิดรายการซ้ำ)
- การตอบกลับตกหล่น

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วแล้วส่งคำตอบแบบเชิงรุก แต่หากการตอบสนองช้ามากก็อาจยังทำให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams รองรับได้น้อยกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **bold**, _italic_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง รายการซ้อน) อาจแสดงผลได้ไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับแบบสำรวจและการส่งแบบ semantic presentation (ดูด้านล่าง)

## การตั้งค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบที่ใช้ร่วมกันของช่องทาง):

- `channels.msteams.enabled`: เปิด/ปิดช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลรับรองของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: allowlist สำหรับ DM (แนะนำให้ใช้ AAD object ID) วิซาร์ดจะ resolve ชื่อเป็น ID ระหว่างการตั้งค่าเมื่อมีสิทธิ์เข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้การจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางด้วยชื่อทีม/ช่องทางโดยตรงอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาด chunk ของข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแยกตามความยาว
- `channels.msteams.mediaAllowHosts`: allowlist สำหรับโฮสต์ของไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: allowlist สำหรับการแนบ Authorization header เมื่อลองดึงสื่อซ้ำ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: กำหนดให้ต้องมี @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การแทนที่รายทีม
- `channels.msteams.teams.<teamId>.requireMention`: การแทนที่รายทีม
- `channels.msteams.teams.<teamId>.tools`: การแทนที่นโยบายเครื่องมือเริ่มต้นรายทีม (`allow`/`deny`/`alsoAllow`) ใช้เมื่อไม่มีการแทนที่ระดับช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: การแทนที่นโยบายเครื่องมือเริ่มต้นรายทีมแยกตามผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การแทนที่นโยบายเครื่องมือรายช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การแทนที่นโยบายเครื่องมือรายช่องทางแยกตามผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- คีย์ `toolsBySender` ควรใช้ prefix แบบระบุชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (คีย์แบบเดิมที่ไม่มี prefix จะยังแมปไปที่ `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดการดำเนินการข้อมูลสมาชิกที่ขับเคลื่อนด้วย Graph (ค่าเริ่มต้น: เปิดใช้เมื่อมีข้อมูลรับรอง Graph พร้อมใช้งาน)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน — `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ certificate แบบ PEM (federated + การยืนยันตัวตนด้วย certificate)
- `channels.msteams.certificateThumbprint`: thumbprint ของ certificate (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `channels.msteams.useManagedIdentity`: เปิดใช้การยืนยันตัวตนด้วย managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ managed identity แบบ user-assigned
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชทกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันเป็นไปตามรูปแบบเอเจนต์มาตรฐาน (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความส่วนตัวจะใช้เซสชัน main ร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความในช่องทาง/กลุ่มจะใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดเทียบกับโพสต์

เมื่อไม่นานมานี้ Teams ได้เพิ่มรูปแบบ UI ของช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| Style                    | Description                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | ข้อความจะแสดงเป็นการ์ด โดยมีการตอบกลับแบบเธรดอยู่ด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **Threads** (คล้าย Slack) | ข้อความจะแสดงต่อเนื่องเป็นเส้นตรง คล้าย Slack                   | `top-level`              |

**ปัญหา:** Teams API ไม่ได้เปิดเผยว่าช่องทางหนึ่งใช้รูปแบบ UI แบบใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางแบบ Threads → การตอบกลับจะซ้อนอย่างดูไม่เป็นธรรมชาติ
- `top-level` ในช่องทางแบบ Posts → การตอบกลับจะปรากฏเป็นโพสต์ระดับบนสุดแยกต่างหากแทนที่จะอยู่ในเธรด

**วิธีแก้:** ตั้งค่า `replyStyle` รายช่องทางตามลักษณะการตั้งค่าของช่องทางนั้น:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DM:** รูปภาพและไฟล์แนบใช้งานได้ผ่าน Teams bot file APIs
- **ช่องทาง/กลุ่ม:** ไฟล์แนบจะอยู่ในที่เก็บ M365 (SharePoint/OneDrive) โดย payload ของ webhook จะมีเพียง HTML stub ไม่ใช่ไบต์ของไฟล์จริง **จำเป็นต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งแบบเริ่มจากไฟล์อย่างชัดเจน ให้ใช้ `action=upload-file` กับ `media` / `filePath` / `path`; ค่า `message` แบบไม่บังคับจะกลายเป็นข้อความ/หมายเหตุประกอบ และ `filename` จะใช้แทนชื่อไฟล์ที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความในช่องทางที่มีรูปภาพจะถูกรับมาเป็นข้อความล้วนเท่านั้น (บอตจะไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
โดยค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจาก hostname ของ Microsoft/Teams เท่านั้น แทนที่ได้ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
Authorization headers จะถูกแนบเฉพาะกับโฮสต์ที่อยู่ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นคือโฮสต์ของ Graph + Bot Framework) ควรจำกัดรายการนี้อย่างเข้มงวด (หลีกเลี่ยง suffix แบบ multi-tenant)

## การส่งไฟล์ในแชทกลุ่ม

บอตสามารถส่งไฟล์ใน DM ได้โดยใช้ขั้นตอน FileConsentCard (มีมาให้ในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชทกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่ต้องมี                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **แชทกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องใช้ `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | inline แบบเข้ารหัส Base64                        | ใช้งานได้ทันที                            |

### เหตุใดแชทกลุ่มจึงต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (`/me/drive` Graph API endpoint ใช้ไม่ได้กับ application identities) ในการส่งไฟล์ในแชทกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** แล้วสร้างลิงก์สำหรับแชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ เปิดใช้ลิงก์แชร์แยกตามผู้ใช้

2. **Grant admin consent** ให้กับ tenant

3. **รับ SharePoint site ID ของคุณ:**

   ```bash
   # ผ่าน Graph Explorer หรือ curl พร้อมโทเค็นที่ใช้ได้:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # ตัวอย่าง: สำหรับไซต์ที่ "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # การตอบกลับจะมี: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **ตั้งค่า OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... การตั้งค่าอื่น ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### พฤติกรรมการแชร์

| Permission                              | พฤติกรรมการแชร์                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` เท่านั้น              | ลิงก์แชร์ได้ทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์แยกตามผู้ใช้ (เฉพาะสมาชิกในแชทเท่านั้นที่เข้าถึงได้)      |

การแชร์แยกตามผู้ใช้มีความปลอดภัยมากกว่า เพราะมีเพียงผู้เข้าร่วมแชทเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะสำรองไปใช้การแชร์ทั้งองค์กร

### พฤติกรรมสำรอง

| สถานการณ์                                          | ผลลัพธ์                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| แชทกลุ่ม + ไฟล์ + ตั้งค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint แล้วส่งลิงก์แชร์            |
| แชทกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว) แล้วส่งข้อความล้วน |
| แชทส่วนตัว + ไฟล์                              | ขั้นตอน FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint)    |
| ทุกบริบท + รูปภาพ                               | inline แบบเข้ารหัส Base64 (ทำงานได้โดยไม่ต้องใช้ SharePoint)   |

### ตำแหน่งที่เก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกเก็บไว้ในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่ตั้งค่าไว้

## แบบสำรวจ (Adaptive Cards)

OpenClaw ส่งแบบสำรวจใน Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบเนทีฟ)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Gateway จะบันทึกการโหวตไว้ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่ตลอดเพื่อบันทึกการโหวต
- แบบสำรวจยังไม่โพสต์สรุปผลลัพธ์อัตโนมัติในขณะนี้ (หากต้องการให้ตรวจดูไฟล์เก็บข้อมูล)

## การ์ดนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนาใน Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รองรับบล็อกเชิงความหมาย เมื่อมี `presentation` ข้อความของข้อความจะเป็นแบบไม่บังคับ

**เครื่องมือเอเจนต์:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

สำหรับรายละเอียดรูปแบบ target ดู [รูปแบบ target](#target-formats) ด้านล่าง

## รูปแบบ target

target ของ MSTeams ใช้ prefix เพื่อแยกระหว่างผู้ใช้กับการสนทนา:

| ประเภท target         | รูปแบบ                           | ตัวอย่าง                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)      | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)              |
| กลุ่ม/ช่องทาง       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/ช่องทาง (ดิบ) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`) |

**ตัวอย่าง CLI:**

```bash
# ส่งถึงผู้ใช้ตาม ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# ส่งถึงผู้ใช้ตามชื่อที่แสดง (จะกระตุ้นการค้นหาผ่าน Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# ส่งถึงแชทกลุ่มหรือช่องทาง
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# ส่งการ์ดนำเสนอไปยังการสนทนา
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**ตัวอย่างเครื่องมือเอเจนต์:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

หมายเหตุ: หากไม่มี prefix `user:` ชื่อจะถูกตีความเป็นการ resolve กลุ่ม/ทีมโดยค่าเริ่มต้น ใช้ `user:` เสมอเมื่อระบุเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง

## การส่งข้อความเชิงรุก

- การส่งข้อความเชิงรุกทำได้ **หลังจาก** ที่ผู้ใช้เคยโต้ตอบแล้วเท่านั้น เพราะเราจะจัดเก็บ conversation reference ในจุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมด้วย allowlist

## Team และ Channel IDs (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์ query `groupId` ใน URL ของ Teams **ไม่ใช่** team ID ที่ใช้สำหรับการตั้งค่า ให้ดึง ID จากส่วน path ของ URL แทน:

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (ถอดรหัส URL ส่วนนี้)
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (ถอดรหัส URL ส่วนนี้)
```

**สำหรับการตั้งค่า:**

- Team ID = ส่วน path หลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`)
- Channel ID = ส่วน path หลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ไม่ต้องสนใจ** พารามิเตอร์ query `groupId`

## Private Channels

บอตรองรับ private channels อย่างจำกัด:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอต             | ได้               | จำกัด                |
| ข้อความแบบเรียลไทม์ (webhook) | ได้               | อาจใช้งานไม่ได้           |
| สิทธิ์ RSC              | ได้               | อาจทำงานแตกต่างกัน |
| @mentions                    | ได้               | ได้หากบอตเข้าถึงได้   |
| ประวัติ Graph API            | ได้               | ได้ (เมื่อมีสิทธิ์) |

**วิธีแก้ชั่วคราวหาก private channels ใช้งานไม่ได้:**

1. ใช้ standard channels สำหรับการโต้ตอบกับบอต
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความหาบอตโดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงข้อมูลย้อนหลัง (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในช่องทาง:** ไม่มีสิทธิ์ Graph หรือยังไม่ได้รับ admin consent ติดตั้งแอป Teams ใหม่ แล้วปิด/เปิด Teams ใหม่ทั้งหมด
- **ไม่มีการตอบกลับในช่องทาง:** โดยค่าเริ่มต้นต้องมี mention; ตั้ง `channels.msteams.requireMention=false` หรือกำหนดค่ารายทีม/ช่องทาง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบแล้วเพิ่มแอปใหม่อีกครั้ง และปิด Teams ให้หมดเพื่อรีเฟรช
- **401 Unauthorized จาก webhook:** ถือว่าเป็นเรื่องปกติเมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายความว่า endpoint เข้าถึงได้ แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ ให้สร้างไอคอน PNG ที่ถูกต้อง (`outline.png` ขนาด 32x32, `color.png` ขนาด 192x192)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชทอื่น ค้นหาแล้วถอนการติดตั้งก่อน หรือรอ 5-10 นาทีให้ระบบกระจายการเปลี่ยนแปลง
- **"Something went wrong" ระหว่างอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบ response body เพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" — วิธีนี้มักข้ามข้อจำกัดของ sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตคุณทุกตัวอักษร
2. อัปโหลดแอปใหม่และติดตั้งใหม่ในทีมหรือแชท
3. ตรวจสอบว่าผู้ดูแลระบบขององค์กรคุณบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ขอบเขตถูกต้อง: `ChannelMessage.Read.Group` สำหรับ teams, `ChatMessage.Read.Chat` สำหรับแชทกลุ่ม

## เอกสารอ้างอิง

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (ช่องทาง/กลุ่มต้องใช้ Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความมั่นคงปลอดภัย
