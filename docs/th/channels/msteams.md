---
read_when:
    - กำลังทำงานกับฟีเจอร์ของช่องทาง Microsoft Teams
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

สถานะ: รองรับข้อความและไฟล์แนบในข้อความส่วนตัวแล้ว; การส่งไฟล์ในแชนเนล/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats)) โพลจะถูกส่งผ่าน Adaptive Cards การดำเนินการกับข้อความมี `upload-file` แบบชัดเจนสำหรับการส่งที่เน้นไฟล์เป็นหลัก

## Plugin ที่รวมมาให้

Microsoft Teams มาพร้อมเป็น Plugin ที่รวมอยู่ใน OpenClaw รุ่นปัจจุบัน ดังนั้นในการติดตั้งแบบแพ็กเกจปกติจึงไม่ต้องติดตั้งแยก

หากคุณใช้รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Teams มาให้
ให้ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install @openclaw/msteams
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอต การสร้าง manifest และการสร้างข้อมูลรับรองได้ในคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # ตรวจสอบว่าคุณเข้าสู่ระบบแล้วและเห็นข้อมูล tenant ของคุณ
```

> **หมายเหตุ:** Teams CLI ยังอยู่ในสถานะ preview คำสั่งและแฟล็กอาจเปลี่ยนแปลงได้ระหว่างรุ่น

**2. เริ่มต้น tunnel** (Teams เข้าถึง localhost ไม่ได้)

ติดตั้งและยืนยันตัวตน devtunnel CLI หากยังไม่ได้ทำ ([คู่มือเริ่มต้นใช้งาน](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started))

```bash
# การตั้งค่าครั้งเดียว (URL คงอยู่ข้ามเซสชัน):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# แต่ละ dev session:
devtunnel host my-openclaw-bot
# endpoint ของคุณ: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **หมายเหตุ:** ต้องใช้ `--allow-anonymous` เพราะ Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ แต่ละคำขอขาเข้าของบอตจะยังคงถูกตรวจสอบความถูกต้องโดย Teams SDK โดยอัตโนมัติ

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (แต่อาจเปลี่ยน URL ในแต่ละเซสชัน)

**3. สร้างแอป**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

คำสั่งเดียวนี้จะ:

- สร้างแอป Entra ID (Azure AD)
- สร้าง client secret
- สร้างและอัปโหลด manifest ของแอป Teams (พร้อมไอคอน)
- ลงทะเบียนบอต (จัดการโดย Teams เป็นค่าเริ่มต้น — ไม่ต้องใช้ Azure subscription)

ผลลัพธ์จะแสดง `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** — จดค่าเหล่านี้ไว้สำหรับขั้นตอนถัดไป นอกจากนี้ยังมีตัวเลือกให้ติดตั้งแอปลงใน Teams โดยตรง

**4. กำหนดค่า OpenClaw** โดยใช้ข้อมูลรับรองจากผลลัพธ์:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

หรือใช้ environment variables โดยตรง: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`

**5. ติดตั้งแอปใน Teams**

`teams app create` จะถามให้คุณติดตั้งแอป — เลือก "Install in Teams" หากคุณข้ามไป สามารถเรียกลิงก์ได้ภายหลัง:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงานได้**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้จะรันการวินิจฉัยครอบคลุมการลงทะเบียนบอต การตั้งค่าแอป AAD ความถูกต้องของ manifest และการตั้งค่า SSO

สำหรับดีพลอยเมนต์ระดับ production ให้พิจารณาใช้ [federated authentication](#federated-authentication-certificate--managed-identity) (certificate หรือ managed identity) แทน client secrets

หมายเหตุ: แชตกลุ่มจะถูกบล็อกเป็นค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้ง `channels.msteams.groupAllowFrom` (หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ โดยยังคงบังคับ mention เป็นค่าเริ่มต้น)

## เป้าหมาย

- คุยกับ OpenClaw ผ่านข้อความส่วนตัว แชตกลุ่ม หรือแชนเนลของ Teams
- ให้การกำหนดเส้นทางเป็นแบบแน่นอน: การตอบกลับจะกลับไปยังช่องทางที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมของช่องทางที่ปลอดภัยเป็นค่าเริ่มต้น (ต้อง mention เว้นแต่จะกำหนดค่าไว้เป็นอย่างอื่น)

## การเขียน config

ตามค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดต config ที่ถูกเรียกจาก `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (ข้อความส่วนตัว + กลุ่ม)

**การเข้าถึงข้อความส่วนตัว**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่คงที่
- อย่าพึ่งพาการจับคู่ UPN/ชื่อที่แสดงสำหรับ allowlist — ค่าเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงเป็นค่าเริ่มต้น; หากต้องการใช้ต้องเปิดเองอย่างชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- ตัวช่วยตั้งค่าสามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลรับรองอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (บล็อกไว้จนกว่าคุณจะเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งรายใดสามารถทริกเกอร์ในแชตกลุ่ม/แชนเนลได้ (fallback ไปที่ `channels.msteams.allowFrom`)
- ตั้ง `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (แต่ยังคงบังคับ mention เป็นค่าเริ่มต้น)
- หากต้องการ **ไม่อนุญาตแชนเนลใดเลย** ให้ตั้ง `channels.msteams.groupPolicy: "disabled"`

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

**allowlist ของ Teams + แชนเนล**

- กำหนดขอบเขตการตอบกลับในกลุ่ม/แชนเนลโดยระบุ teams และ channels ไว้ภายใต้ `channels.msteams.teams`
- key ควรใช้ team ID และ channel conversation ID ที่คงที่
- เมื่อ `groupPolicy="allowlist"` และมี teams allowlist อยู่ จะยอมรับเฉพาะ teams/channels ที่อยู่ในรายการเท่านั้น (โดยยังคงบังคับ mention)
- ตัวช่วยตั้งค่ารองรับรายการ `Team/Channel` และจะบันทึกให้คุณ
- เมื่อเริ่มต้น OpenClaw จะ resolve ชื่อ team/channel และ allowlist ของผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping ลงใน log; ชื่อ team/channel ที่ resolve ไม่ได้จะถูกเก็บไว้ตามที่พิมพ์ แต่ตามค่าเริ่มต้นจะถูกละเว้นสำหรับการกำหนดเส้นทาง เว้นแต่จะเปิด `channels.msteams.dangerouslyAllowNameMatching: true`

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

<details>
<summary><strong>การตั้งค่าด้วยตนเอง (โดยไม่ใช้ Teams CLI)</strong></summary>

หากคุณไม่สามารถใช้ Teams CLI ได้ คุณสามารถตั้งค่าบอตด้วยตนเองผ่าน Azure Portal

### วิธีการทำงาน

1. ตรวจสอบให้แน่ใจว่า Plugin Microsoft Teams พร้อมใช้งานแล้ว (รวมมาให้ในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอตและมีสิทธิ์ RSC ตามด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงใน team (หรือ personal scope สำหรับข้อความส่วนตัว)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือ env vars) และเริ่มต้น gateway
6. Gateway จะรับฟังทราฟฟิก webhook ของ Bot Framework ที่ `/api/messages` เป็นค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | Field              | Value |
   | ------------------ | ----- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำกัน) |
   | **Subscription**   | เลือก Azure subscription ของคุณ |
   | **Resource group** | สร้างใหม่หรือใช้ของเดิม |
   | **Pricing tier**   | **Free** สำหรับ dev/testing |
   | **Type of App**    | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง) |
   | **Creation type**  | **Create new Microsoft App ID** |

> **ประกาศการเลิกใช้งาน:** การสร้างบอตแบบ multi-tenant ใหม่ถูกเลิกใช้งานหลังจาก 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่

3. คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลรับรอง

1. ไปที่ทรัพยากร Azure Bot ของคุณ → **Configuration**
2. คัดลอก **Microsoft App ID** → นี่คือ `appId` ของคุณ
3. คลิก **Manage Password** → ไปที่ App Registration
4. ภายใต้ **Certificates & secrets** → **New client secret** → คัดลอก **Value** → นี่คือ `appPassword` ของคุณ
5. ไปที่ **Overview** → คัดลอก **Directory (tenant) ID** → นี่คือ `tenantId` ของคุณ

### ขั้นตอนที่ 3: กำหนดค่า Messaging Endpoint

1. ใน Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint** เป็น URL webhook ของคุณ:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: ใช้ tunnel (ดู [Local Development](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้งาน Teams Channel

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

### ขั้นตอนที่ 5: สร้าง Teams App Manifest

- เพิ่มรายการ `bot` โดยให้ `botId = <App ID>`
- Scopes: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ใน personal scope)
- เพิ่มสิทธิ์ RSC (ดู [RSC Permissions](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- zip ทั้งสามไฟล์รวมกัน: `manifest.json`, `outline.png`, `color.png`

### ขั้นตอนที่ 6: กำหนดค่า OpenClaw

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

Environment variables: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`

### ขั้นตอนที่ 7: เรียกใช้ Gateway

Teams channel จะเริ่มทำงานโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและมี config `msteams` พร้อมข้อมูลรับรอง

</details>

## Federated Authentication (Certificate + Managed Identity)

> เพิ่มใน 2026.3.24

สำหรับดีพลอยเมนต์ระดับ production OpenClaw รองรับ **federated authentication** เป็นทางเลือกที่ปลอดภัยกว่า client secrets โดยมีให้เลือกสองวิธี:

### ตัวเลือก A: การยืนยันตัวตนด้วย certificate

ใช้ certificate แบบ PEM ที่ลงทะเบียนกับ app registration ของ Entra ID

**การตั้งค่า:**

1. สร้างหรือรับ certificate (รูปแบบ PEM พร้อม private key)
2. ใน Entra ID → App Registration → **Certificates & secrets** → **Certificates** → อัปโหลด public certificate

**Config:**

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

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน เหมาะอย่างยิ่งสำหรับดีพลอยเมนต์บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity ให้ใช้

**วิธีการทำงาน:**

1. pod/VM ของบอตมี managed identity (แบบ system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity เข้ากับ app registration ของ Entra ID
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับโทเค็นจาก Azure IMDS endpoint (`169.254.169.254`)
4. โทเค็นจะถูกส่งต่อไปยัง Teams SDK เพื่อยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- มีการสร้าง federated identity credential บน app registration ของ Entra ID
- มีการเข้าถึงเครือข่ายไปยัง IMDS (`169.254.169.254:80`) จาก pod/VM

**Config (managed identity แบบ system-assigned):**

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

**Config (managed identity แบบ user-assigned):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะ user-assigned)

### การตั้งค่า AKS Workload Identity

สำหรับดีพลอยเมนต์ AKS ที่ใช้ workload identity:

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

3. **ใส่ annotation ให้กับ Kubernetes service account** ด้วย app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **ใส่ label ให้กับ pod** เพื่อเปิดใช้การฉีด workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้แน่ใจว่าสามารถเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) — หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` ที่พอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| Method               | Config                                         | ข้อดี | ข้อเสีย |
| -------------------- | ---------------------------------------------- | ----- | -------- |
| **Client secret**    | `appPassword`                                  | ตั้งค่าได้ง่าย | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ไม่มี shared secret ผ่านเครือข่าย | มีภาระในการจัดการ certificate |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ต้องใช้รหัสผ่าน, ไม่มี secrets ให้จัดการ | ต้องใช้โครงสร้างพื้นฐาน Azure |

**พฤติกรรมค่าเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนด้วย client secret เป็นค่าเริ่มต้น การกำหนดค่าที่มีอยู่เดิมยังคงทำงานได้โดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (Tunneling)

Teams เข้าถึง `localhost` ไม่ได้ ใช้ dev tunnel แบบถาวรเพื่อให้ URL ของคุณคงเดิมข้ามเซสชัน:

```bash
# การตั้งค่าครั้งเดียว:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# แต่ละ dev session:
devtunnel host my-openclaw-bot
```

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละเซสชัน)

หาก URL ของ tunnel เปลี่ยน ให้อัปเดต endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## การทดสอบบอต

**รันการวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียนบอต แอป AAD manifest และการกำหนดค่า SSO ในครั้งเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ใช้ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหาบอตใน Teams แล้วส่งข้อความส่วนตัว
3. ตรวจสอบ log ของ gateway สำหรับกิจกรรมขาเข้า

## Environment variables

สามารถตั้งค่าคีย์ config ทั้งหมดผ่าน environment variables ได้เช่นกัน:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ, ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ user-assigned MI)

## การดำเนินการ member info

OpenClaw เปิดให้ใช้การดำเนินการ `member-info` ที่ทำงานผ่าน Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถ resolve รายละเอียดสมาชิกในแชนเนลได้โดยตรงจาก Microsoft Graph (ชื่อที่แสดง อีเมล บทบาท)

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Microsoft Graph Application `User.Read.All` พร้อม admin consent

การดำเนินการนี้ถูกควบคุมโดย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้เมื่อมีข้อมูลรับรอง Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความล่าสุดในแชนเนล/กลุ่มที่จะถูกห่อเข้าไปใน prompt
- fallback ไปที่ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองตาม allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการป้อนบริบทเธรดเริ่มต้นจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่อ้างอิง (`ReplyTo*` ที่อนุมานมาจาก reply HTML ของ Teams) ขณะนี้จะถูกส่งผ่านตามที่ได้รับ
- กล่าวอีกนัยหนึ่ง allowlist ควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้; ปัจจุบันมีเพียงเส้นทางบริบทเสริมบางแบบเท่านั้นที่ถูกกรอง
- ประวัติข้อความส่วนตัวจำกัดได้ด้วย `channels.msteams.dmHistoryLimit` (เทิร์นของผู้ใช้) การแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ Teams RSC ปัจจุบัน (Manifest)

นี่คือ **resourceSpecific permissions** ที่มีอยู่ใน manifest ของแอป Teams ของเราในปัจจุบัน โดยจะมีผลเฉพาะภายใน team/chat ที่ติดตั้งแอปไว้เท่านั้น

**สำหรับแชนเนล (team scope):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความแชนเนลทั้งหมดได้โดยไม่ต้อง @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับแชตกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความแชตกลุ่มทั้งหมดได้โดยไม่ต้อง @mention

หากต้องการเพิ่มสิทธิ์ RSC ผ่าน Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## ตัวอย่าง Teams Manifest (ปกปิดข้อมูลแล้ว)

ตัวอย่างแบบน้อยที่สุดที่ถูกต้องพร้อมฟิลด์ที่จำเป็น แทนที่ ID และ URL ตามต้องการ

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

### ข้อควรระวังของ Manifest (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง** ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง** ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวมพื้นผิวที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- `bots[].supportsFiles: true` จำเป็นสำหรับการจัดการไฟล์ใน personal scope
- `authorization.permissions.resourceSpecific` ต้องมีสิทธิ์อ่าน/ส่งในแชนเนล หากคุณต้องการทราฟฟิกของแชนเนล

### การอัปเดตแอปที่มีอยู่แล้ว

หากต้องการอัปเดตแอป Teams ที่ติดตั้งอยู่แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# ดาวน์โหลด แก้ไข และอัปโหลด manifest ใหม่
teams app manifest download <teamsAppId> manifest.json
# แก้ไข manifest.json ในเครื่อง...
teams app manifest upload manifest.json <teamsAppId>
# จะเพิ่ม version อัตโนมัติหากเนื้อหามีการเปลี่ยนแปลง
```

หลังการอัปเดต ให้ติดตั้งแอปใหม่ในแต่ละ team เพื่อให้สิทธิ์ใหม่มีผล และ **ออกจาก Teams ให้หมดแล้วเปิดใหม่อีกครั้ง** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

<details>
<summary>การอัปเดต manifest ด้วยตนเอง (โดยไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **zip ใหม่** manifest พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **Teams Admin Center:** Teams apps → Manage apps → หาแอปของคุณ → Upload new version
   - **Sideload:** ใน Teams → Apps → Manage your apps → Upload a custom app

</details>

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อมี **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว ไม่มีสิทธิ์ Microsoft Graph API)

ทำได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความในแชนเนล
- ส่งเนื้อหา **ข้อความ** ไปยังแชนเนล
- รับไฟล์แนบใน **ข้อความส่วนตัว (DM)**

ทำไม่ได้:

- เนื้อหา **รูปภาพหรือไฟล์** ในแชนเนล/กลุ่ม (payload จะมีเพียง HTML stub)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจาก event webhook แบบสด)

### เมื่อมี **Teams RSC + สิทธิ์ Microsoft Graph Application**

จะเพิ่มความสามารถดังนี้:

- ดาวน์โหลด hosted contents (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความในแชนเนล/แชตผ่าน Graph

### RSC เทียบกับ Graph API

| Capability              | สิทธิ์ RSC | Graph API |
| ----------------------- | ---------- | --------- |
| **ข้อความแบบเรียลไทม์** | ได้ (ผ่าน webhook) | ไม่ได้ (polling เท่านั้น) |
| **ข้อความย้อนหลัง** | ไม่ได้ | ได้ (สามารถ query ประวัติได้) |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ app manifest | ต้องมี admin consent + token flow |
| **ทำงานขณะออฟไลน์** | ไม่ได้ (ต้องกำลังรันอยู่) | ได้ (query ได้ทุกเวลา) |

**สรุป:** RSC ใช้สำหรับการรับฟังแบบเรียลไทม์; Graph API ใช้สำหรับการเข้าถึงข้อมูลย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไปขณะออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมี admin consent)

## สื่อ + ประวัติที่เปิดใช้ Graph (จำเป็นสำหรับแชนเนล)

หากคุณต้องการรูปภาพ/ไฟล์ใน **แชนเนล** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ admin consent

1. ใน Entra ID (Azure AD) **App Registration** ให้เพิ่มสิทธิ์ Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` (ไฟล์แนบและประวัติในแชนเนล)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชตกลุ่ม)
2. **Grant admin consent** ให้กับ tenant
3. เพิ่มค่า **manifest version** ของแอป Teams อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ออกจาก Teams ให้หมดแล้วเปิดใหม่อีกครั้ง** เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับ user mentions:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ที่อยู่ในการสนทนาอยู่แล้ว อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้แบบไดนามิกที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ admin consent

## ข้อจำกัดที่ทราบ

### Webhook timeouts

Teams ส่งข้อความผ่าน HTTP webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับจาก LLM ช้า) คุณอาจพบว่า:

- Gateway timeout
- Teams ลองส่งข้อความใหม่ (ทำให้เกิดข้อความซ้ำ)
- การตอบกลับหลุดหาย

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งคำตอบแบบ proactive แต่การตอบสนองที่ช้ามากอาจยังคงก่อให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการแบบซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งแบบ semantic presentation (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดใช้งานช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลรับรองของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: allowlist ของข้อความส่วนตัว (แนะนำให้ใช้ AAD object ID) ตัวช่วยตั้งค่าจะ resolve ชื่อเป็น ID ระหว่างการตั้งค่าเมื่อมีการเข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้การจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้อีกครั้ง และการกำหนดเส้นทาง team/channel ตามชื่อโดยตรง
- `channels.msteams.textChunkLimit`: ขนาดชังก์ของข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแยกตามความยาว
- `channels.msteams.mediaAllowHosts`: allowlist สำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นคือโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: allowlist สำหรับการแนบ Authorization header ในการลองดึงสื่อใหม่ (ค่าเริ่มต้นคือโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: ต้อง @mention ในแชนเนล/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การแทนที่ราย team
- `channels.msteams.teams.<teamId>.requireMention`: การแทนที่ราย team
- `channels.msteams.teams.<teamId>.tools`: การแทนที่นโยบายเครื่องมือเริ่มต้นราย team (`allow`/`deny`/`alsoAllow`) ใช้เมื่อไม่มีการแทนที่ระดับ channel
- `channels.msteams.teams.<teamId>.toolsBySender`: การแทนที่นโยบายเครื่องมือรายผู้ส่งเริ่มต้นราย team (รองรับ wildcard `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การแทนที่ราย channel
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การแทนที่ราย channel
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การแทนที่นโยบายเครื่องมือราย channel (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การแทนที่นโยบายเครื่องมือรายผู้ส่งราย channel (รองรับ wildcard `"*"`)
- key ของ `toolsBySender` ควรใช้ prefix แบบชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (key แบบเดิมที่ไม่มี prefix จะยังคงแมปไปที่ `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดการดำเนินการ member info ที่ทำงานผ่าน Graph (ค่าเริ่มต้น: เปิดเมื่อมีข้อมูลรับรอง Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน — `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ certificate แบบ PEM (federated + certificate auth)
- `channels.msteams.certificateThumbprint`: thumbprint ของ certificate (ไม่บังคับ, ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `channels.msteams.useManagedIdentity`: เปิดใช้การยืนยันตัวตนด้วย managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ user-assigned managed identity
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชตกลุ่ม/แชนเนล (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันเป็นไปตามรูปแบบเอเจนต์มาตรฐาน (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความส่วนตัวใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความในแชนเนล/กลุ่มใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดเทียบกับโพสต์

เมื่อไม่นานมานี้ Teams ได้เพิ่มรูปแบบ UI ของแชนเนลสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| Style                    | คำอธิบาย | `replyStyle` ที่แนะนำ |
| ------------------------ | --------- | --------------------- |
| **Posts** (แบบคลาสสิก)  | ข้อความจะแสดงเป็นการ์ดพร้อมการตอบกลับแบบเธรดด้านล่าง | `thread` (ค่าเริ่มต้น) |
| **Threads** (คล้าย Slack) | ข้อความไหลต่อเนื่องแบบเชิงเส้น คล้าย Slack มากกว่า | `top-level` |

**ปัญหา:** Teams API ไม่เปิดเผยว่าแชนเนลใช้รูปแบบ UI ใด หากคุณใช้ `replyStyle` ไม่ถูกต้อง:

- `thread` ในแชนเนลแบบ Threads → การตอบกลับจะซ้อนอย่างไม่เหมาะสม
- `top-level` ในแชนเนลแบบ Posts → การตอบกลับจะปรากฏเป็นโพสต์ระดับบนแยกต่างหากแทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนดค่า `replyStyle` ราย channel ตามวิธีการตั้งค่าของแชนเนล:

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

**ข้อจำกัดในปัจจุบัน:**

- **ข้อความส่วนตัว:** รูปภาพและไฟล์แนบใช้งานได้ผ่าน Teams bot file APIs
- **แชนเนล/กลุ่ม:** ไฟล์แนบจะอยู่ในที่เก็บข้อมูล M365 (SharePoint/OneDrive) payload ของ webhook จะมีเพียง HTML stub ไม่ใช่ข้อมูลไบต์ของไฟล์จริง **ต้องใช้สิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของแชนเนล
- สำหรับการส่งแบบไฟล์ก่อนอย่างชัดเจน ให้ใช้ `action=upload-file` กับ `media` / `filePath` / `path`; `message` แบบไม่บังคับจะกลายเป็นข้อความ/คอมเมนต์ที่แนบไปด้วย และ `filename` จะใช้แทนชื่อไฟล์ที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความในแชนเนลที่มีรูปภาพจะถูกรับเป็นข้อความอย่างเดียว (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
ตามค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น แทนที่ได้ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
Authorization headers จะถูกแนบเฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นคือโฮสต์ Graph + Bot Framework) ควรรักษารายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบ multi-tenant)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ในข้อความส่วนตัวได้ด้วยโฟลว์ FileConsentCard (มีมาให้ในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/แชนเนล** ต้องมีการตั้งค่าเพิ่มเติม:

| Context                  | วิธีส่งไฟล์ | การตั้งค่าที่ต้องใช้ |
| ------------------------ | ----------- | -------------------- |
| **ข้อความส่วนตัว**       | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที |
| **แชตกลุ่ม/แชนเนล**     | อัปโหลดไปยัง SharePoint → แชร์ลิงก์ | ต้องใช้ `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุก context)** | inline แบบเข้ารหัส Base64 | ใช้งานได้ทันที |

### เหตุใดแชตกลุ่มจึงต้องใช้ SharePoint

บอตไม่มี OneDrive ส่วนตัวของตัวเอง (`/me/drive` endpoint ของ Graph API ใช้ไม่ได้กับ application identities) หากต้องการส่งไฟล์ในแชตกลุ่ม/แชนเนล บอตจะอัปโหลดไปยัง **SharePoint site** และสร้างลิงก์สำหรับแชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ, เปิดใช้ลิงก์แชร์รายผู้ใช้

2. **Grant admin consent** ให้กับ tenant

3. **รับ SharePoint site ID ของคุณ:**

   ```bash
   # ผ่าน Graph Explorer หรือ curl พร้อมโทเค็นที่ถูกต้อง:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # ตัวอย่าง: สำหรับ site ที่ "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # การตอบกลับจะมี: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **กำหนดค่า OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... config อื่น ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### พฤติกรรมการแชร์

| Permission                              | พฤติกรรมการแชร์ |
| --------------------------------------- | ---------------- |
| `Sites.ReadWrite.All` เท่านั้น          | ลิงก์แชร์ทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกในแชตเข้าถึงได้) |

การแชร์รายผู้ใช้ปลอดภัยกว่า เพราะมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback ไปใช้การแชร์ทั้งองค์กร

### พฤติกรรม fallback

| สถานการณ์                                        | ผลลัพธ์ |
| ------------------------------------------------- | ------- |
| แชตกลุ่ม + ไฟล์ + มีการกำหนดค่า `sharePointSiteId` | อัปโหลดไปยัง SharePoint แล้วส่งลิงก์แชร์ |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`        | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว) แล้วส่งเฉพาะข้อความ |
| แชตส่วนตัว + ไฟล์                                  | โฟลว์ FileConsentCard (ใช้งานได้โดยไม่ต้องมี SharePoint) |
| ทุก context + รูปภาพ                               | inline แบบเข้ารหัส Base64 (ใช้งานได้โดยไม่ต้องมี SharePoint) |

### ตำแหน่งที่เก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกเก็บไว้ในโฟลเดอร์ `/OpenClawShared/` ใน document library เริ่มต้นของ SharePoint site ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพลของ Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบเนทีฟ)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- คะแนนโหวตจะถูกบันทึกโดย gateway ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- ขณะนี้โพลยังไม่โพสต์สรุปผลโดยอัตโนมัติ (หากจำเป็นให้ตรวจสอบไฟล์ที่เก็บข้อมูล)

## Presentation Cards

ส่ง payload แบบ semantic presentation ไปยังผู้ใช้หรือบทสนทนาใน Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะเรนเดอร์สิ่งเหล่านี้เป็น Teams Adaptive Cards จากสัญญา presentation ทั่วไป

พารามิเตอร์ `presentation` รับ semantic blocks เมื่อมี `presentation` ข้อความของข้อความจะเป็นแบบไม่บังคับ

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

target ของ MSTeams ใช้ prefix เพื่อแยกความแตกต่างระหว่างผู้ใช้และบทสนทนา:

| Target type         | Format                           | Example |
| ------------------- | -------------------------------- | ------- |
| ผู้ใช้ (ตาม ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| ผู้ใช้ (ตามชื่อ)    | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API) |
| กลุ่ม/แชนเนล       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| กลุ่ม/แชนเนล (ดิบ) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`) |

**ตัวอย่าง CLI:**

```bash
# ส่งไปยังผู้ใช้ตาม ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# ส่งไปยังผู้ใช้ตามชื่อที่แสดง (ทริกเกอร์การค้นหาผ่าน Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# ส่งไปยังแชตกลุ่มหรือแชนเนล
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# ส่ง presentation card ไปยังบทสนทนา
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

หมายเหตุ: หากไม่มี prefix `user:` ชื่อจะถูกตีความเป็นการ resolve กลุ่ม/team โดยค่าเริ่มต้น ใช้ `user:` เสมอเมื่อต้องการระบุผู้คนด้วยชื่อที่แสดง

## การส่งข้อความแบบ proactive

- ข้อความแบบ proactive จะทำได้ **หลังจาก** ผู้ใช้มีการโต้ตอบแล้วเท่านั้น เพราะเราจะเก็บ conversation reference ในจุดนั้น
- ดู `/gateway/configuration` สำหรับการควบคุม `dmPolicy` และ allowlist

## Team ID และ Channel ID (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์ query `groupId` ใน URL ของ Teams **ไม่ใช่** team ID ที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จาก path ของ URL แทน:

**URL ของ Team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (ถอดรหัส URL นี้)
```

**URL ของ Channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (ถอดรหัส URL นี้)
```

**สำหรับ config:**

- Team ID = ส่วนของ path หลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`)
- Channel ID = ส่วนของ path หลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ไม่ต้องสนใจ** พารามิเตอร์ query `groupId`

## Private Channels

บอตรองรับ private channels อย่างจำกัด:

| Feature                      | Standard Channels | Private Channels |
| ---------------------------- | ----------------- | ---------------- |
| การติดตั้งบอต               | ได้               | จำกัด            |
| ข้อความแบบเรียลไทม์ (webhook) | ได้             | อาจใช้งานไม่ได้ |
| สิทธิ์ RSC                   | ได้               | อาจมีพฤติกรรมต่างออกไป |
| @mentions                    | ได้               | ได้ หากบอตเข้าถึงได้ |
| ประวัติผ่าน Graph API        | ได้               | ได้ (เมื่อมีสิทธิ์) |

**วิธีแก้ไขชั่วคราวหาก private channels ใช้งานไม่ได้:**

1. ใช้ standard channels สำหรับการโต้ตอบกับบอต
2. ใช้ข้อความส่วนตัว - ผู้ใช้สามารถส่งข้อความถึงบอตได้โดยตรงเสมอ
3. ใช้ Graph API สำหรับการเข้าถึงประวัติย้อนหลัง (ต้องมี `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในแชนเนล:** ไม่มีสิทธิ์ Graph หรือไม่มี admin consent ให้ติดตั้งแอป Teams ใหม่และออก/เปิด Teams ใหม่ทั้งหมด
- **ไม่มีการตอบกลับในแชนเนล:** โดยค่าเริ่มต้นต้อง mention ให้ตั้ง `channels.msteams.requireMention=false` หรือกำหนดค่าแยกตาม team/channel
- **version ไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบแอปออกแล้วเพิ่มใหม่ และออกจาก Teams ให้หมดเพื่อรีเฟรช
- **401 Unauthorized จาก webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายความว่า endpoint เข้าถึงได้แต่การยืนยันตัวตนล้มเหลว ให้ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด Manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ ให้สร้างไอคอน PNG ที่ถูกต้อง (`outline.png` ขนาด 32x32, `color.png` ขนาด 192x192)
- **"webApplicationInfo.Id already in use":** แอปยังคงติดตั้งอยู่ใน team/chat อื่น ให้ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีให้การเผยแพร่เสร็จ
- **"Something went wrong" ตอนอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน จากนั้นเปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบ response body เพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" - วิธีนี้มักหลีกเลี่ยงข้อจำกัดของ sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตของคุณทุกตัวอักษร
2. อัปโหลดแอปใหม่และติดตั้งใหม่ใน team/chat
3. ตรวจสอบว่าแอดมินขององค์กรคุณบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับ teams, `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## แหล่งอ้างอิง

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (แชนเนล/กลุ่มต้องใช้ Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอต

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนข้อความส่วนตัวและโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ปลอดภัยยิ่งขึ้น
