---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T17:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: be669545bd692754fbee8b670b1b482c39399a3d26e06a7ae01230fdaee645fe
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความ + ไฟล์แนบใน DM แล้ว; การส่งไฟล์ในแชนเนล/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats)) โพลจะถูกส่งผ่าน Adaptive Cards การกระทำกับข้อความเปิดเผย `upload-file` แบบชัดเจนสำหรับการส่งที่เริ่มจากไฟล์

## Plugin ที่รวมมาให้

Microsoft Teams จัดส่งมาเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน ดังนั้นจึงไม่จำเป็นต้องติดตั้งแยกต่างหากในบิลด์แพ็กเกจปกติ

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ที่รวมมาให้ ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้แพ็กเกจเปล่าเพื่อให้ตามแท็กรุ่นอย่างเป็นทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

เช็กเอาต์ในเครื่อง (เมื่อรันจาก repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอต การสร้าง manifest และการสร้างข้อมูลรับรองได้ในคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI อยู่ในช่วงพรีวิว คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรุ่นได้
</Note>

**2. เริ่ม tunnel** (Teams เข้าถึง localhost ไม่ได้)

ติดตั้งและยืนยันตัวตน devtunnel CLI หากคุณยังไม่ได้ทำ ([คู่มือเริ่มต้นใช้งาน](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started))

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
จำเป็นต้องใช้ `--allow-anonymous` เพราะ Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ คำขอบอตขาเข้าแต่ละรายการยังคงถูกตรวจสอบโดย Teams SDK โดยอัตโนมัติ
</Note>

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (แต่สิ่งเหล่านี้อาจเปลี่ยน URL ในแต่ละเซสชัน)

**3. สร้างแอป**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

คำสั่งเดียวนี้จะ:

- สร้างแอปพลิเคชัน Entra ID (Azure AD)
- สร้าง client secret
- สร้างและอัปโหลด Teams app manifest (พร้อมไอคอน)
- ลงทะเบียนบอต (Teams จัดการให้โดยค่าเริ่มต้น - ไม่ต้องใช้การสมัครใช้งาน Azure)

เอาต์พุตจะแสดง `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** - จดค่าเหล่านี้ไว้สำหรับขั้นตอนถัดไป นอกจากนี้ยังเสนอให้ติดตั้งแอปใน Teams โดยตรงด้วย

**4. กำหนดค่า OpenClaw** โดยใช้ข้อมูลรับรองจากเอาต์พุต:

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

หรือใช้ตัวแปรสภาพแวดล้อมโดยตรง: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`

**5. ติดตั้งแอปใน Teams**

`teams app create` จะถามให้คุณติดตั้งแอป - เลือก "Install in Teams" หากคุณข้ามไป คุณสามารถรับลิงก์ภายหลังได้:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงาน**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้รันการวินิจฉัยครอบคลุมการลงทะเบียนบอต การกำหนดค่าแอป AAD ความถูกต้องของ manifest และการตั้งค่า SSO

สำหรับการปรับใช้จริง ควรพิจารณาใช้ [การยืนยันตัวตนแบบ federated](/th/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificate หรือ managed identity) แทน client secrets

<Note>
แชทกลุ่มถูกบล็อกโดยค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (มีการควบคุมด้วยการ mention)
</Note>

## เป้าหมาย

- คุยกับ OpenClaw ผ่าน DM ของ Teams, แชทกลุ่ม หรือแชนเนล
- ทำให้การกำหนดเส้นทางคาดเดาได้: การตอบกลับจะกลับไปยังแชนเนลที่ส่งเข้ามาเสมอ
- ใช้พฤติกรรมแชนเนลที่ปลอดภัยเป็นค่าเริ่มต้น (ต้อง mention เว้นแต่จะกำหนดค่าไว้เป็นอย่างอื่น)

## การเขียนค่า config

โดยค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดต config ที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่เสถียร
- อย่าพึ่งพาการจับคู่ UPN/ชื่อที่แสดงสำหรับ allowlist - สิ่งเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อตรงโดยค่าเริ่มต้น; เลือกใช้แบบชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- วิซาร์ดสามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลรับรองอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อกเว้นแต่คุณจะเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งใดสามารถทริกเกอร์ในแชทกลุ่ม/แชนเนลได้ (fallback ไปที่ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ยังคงมีการควบคุมด้วยการ mention โดยค่าเริ่มต้น)
- หากต้องการไม่อนุญาต **แชนเนลใดเลย** ให้ตั้งค่า `channels.msteams.groupPolicy: "disabled"`

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

**Teams + allowlist ของแชนเนล**

- จำกัดขอบเขตการตอบกลับในกลุ่ม/แชนเนลด้วยการระบุทีมและแชนเนลใต้ `channels.msteams.teams`
- คีย์ควรใช้ Teams conversation ID ที่เสถียรจากลิงก์ Teams ไม่ใช่ชื่อที่แสดงที่เปลี่ยนแปลงได้
- เมื่อ `groupPolicy="allowlist"` และมี allowlist ของทีม เฉพาะทีม/แชนเนลที่ระบุไว้เท่านั้นที่จะถูกยอมรับ (มีการควบคุมด้วยการ mention)
- วิซาร์ดกำหนดค่ายอมรับรายการ `Team/Channel` และจัดเก็บให้คุณ
- เมื่อเริ่มต้น OpenClaw จะแปลงชื่อ allowlist ของทีม/แชนเนลและผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping; ชื่อทีม/แชนเนลที่แปลงไม่ได้จะถูกเก็บตามที่พิมพ์ แต่จะถูกเพิกเฉยสำหรับการกำหนดเส้นทางโดยค่าเริ่มต้น เว้นแต่เปิดใช้ `channels.msteams.dangerouslyAllowNameMatching: true`

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

หากคุณใช้ Teams CLI ไม่ได้ คุณสามารถตั้งค่าบอตด้วยตนเองผ่าน Azure Portal

### วิธีการทำงาน

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน (รวมมาให้ในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **Teams app package** ที่อ้างอิงบอตและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงในทีม (หรือขอบเขตส่วนบุคคลสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) แล้วเริ่ม Gateway
6. Gateway รับทราฟฟิก Bot Framework Webhook ที่ `/api/messages` โดยค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [สร้าง Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | ฟิลด์ | ค่า |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription** | เลือกการสมัครใช้งาน Azure ของคุณ |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่ |
   | **Pricing tier** | **Free** สำหรับ dev/testing |
   | **Type of App** | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง) |
   | **Creation type** | **Create new Microsoft App ID** |

<Warning>
การสร้างบอต multi-tenant ใหม่ถูกเลิกใช้หลัง 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่
</Warning>

3. คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลรับรอง

1. ไปที่ทรัพยากร Azure Bot ของคุณ → **Configuration**
2. คัดลอก **Microsoft App ID** → นี่คือ `appId` ของคุณ
3. คลิก **Manage Password** → ไปที่ App Registration
4. ใต้ **Certificates & secrets** → **New client secret** → คัดลอก **Value** → นี่คือ `appPassword` ของคุณ
5. ไปที่ **Overview** → คัดลอก **Directory (tenant) ID** → นี่คือ `tenantId` ของคุณ

### ขั้นตอนที่ 3: กำหนดค่า Messaging Endpoint

1. ใน Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint** เป็น Webhook URL ของคุณ:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: ใช้ tunnel (ดู [การพัฒนาในเครื่อง](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้แชนเนล Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

### ขั้นตอนที่ 5: สร้าง Teams App Manifest

- รวมรายการ `bot` พร้อม `botId = <App ID>`
- ขอบเขต: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขต personal)
- เพิ่มสิทธิ์ RSC (ดู [สิทธิ์ RSC](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- บีบอัดไฟล์ทั้งสามเข้าด้วยกัน: `manifest.json`, `outline.png`, `color.png`

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

ตัวแปรสภาพแวดล้อม: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`

### ขั้นตอนที่ 7: รัน Gateway

แชนเนล Teams จะเริ่มโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและมี config `msteams` พร้อมข้อมูลรับรอง

</details>

## การยืนยันตัวตนแบบ federated (certificate พร้อม managed identity)

> เพิ่มใน 2026.4.11

สำหรับการปรับใช้จริง OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่าสำหรับ client secrets มีให้ใช้สองวิธี:

### ตัวเลือก A: การยืนยันตัวตนด้วย certificate

ใช้ certificate แบบ PEM ที่ลงทะเบียนกับการลงทะเบียนแอป Entra ID ของคุณ

**การตั้งค่า:**

1. สร้างหรือขอรับ certificate (รูปแบบ PEM พร้อม private key)
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

**ตัวแปรสภาพแวดล้อม:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### ตัวเลือก B: Azure Managed Identity

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน วิธีนี้เหมาะสำหรับการปรับใช้บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity พร้อมใช้งาน

**วิธีการทำงาน:**

1. พ็อด/VM ของบอตมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity เข้ากับการลงทะเบียนแอป Entra ID
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับโทเคนจาก Azure IMDS endpoint (`169.254.169.254`)
4. โทเคนจะถูกส่งต่อไปยัง Teams SDK สำหรับการยืนยันตัวตนบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- สร้าง federated identity credential บนการลงทะเบียนแอป Entra ID แล้ว
- การเข้าถึงเครือข่ายไปยัง IMDS (`169.254.169.254:80`) จากพ็อด/VM

**Config (system-assigned managed identity):**

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

**การกำหนดค่า (managed identity แบบ user-assigned):**

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

**ตัวแปรสภาพแวดล้อม:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะสำหรับ user-assigned)

### การตั้งค่า AKS Workload Identity

สำหรับการปรับใช้ AKS ที่ใช้ workload identity:

1. **เปิดใช้งาน workload identity** บนคลัสเตอร์ AKS ของคุณ
2. **สร้าง federated identity credential** บนการลงทะเบียนแอป Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **ใส่ annotation ให้บัญชีบริการ Kubernetes** ด้วย ID ไคลเอนต์ของแอป:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **ใส่ label ให้ pod** เพื่อฉีด workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบการเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) - หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธี                  | การกำหนดค่า                                   | ข้อดี                              | ข้อเสีย                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | ตั้งค่าเรียบง่าย                  | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ไม่มี shared secret ผ่านเครือข่าย | มีภาระในการจัดการ certificate       |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ต้องใช้รหัสผ่าน, ไม่มี secrets ให้จัดการ | ต้องใช้โครงสร้างพื้นฐาน Azure         |

**พฤติกรรมเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนแบบ client secret เป็นค่าเริ่มต้น การกำหนดค่าที่มีอยู่จะยังใช้งานได้ต่อไปโดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ dev tunnel แบบถาวรเพื่อให้ URL ของคุณยังคงเดิมข้าม session:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

ทางเลือก: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละ session)

หาก URL ของ tunnel เปลี่ยน ให้อัปเดต endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## การทดสอบ Bot

**รันการวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียน bot, แอป AAD, manifest และการกำหนดค่า SSO ในรอบเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ใช้ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหา bot ใน Teams แล้วส่ง DM
3. ตรวจสอบล็อก Gateway สำหรับกิจกรรมที่เข้ามา

## ตัวแปรสภาพแวดล้อม

คีย์การกำหนดค่าทั้งหมดสามารถตั้งค่าผ่านตัวแปรสภาพแวดล้อมแทนได้:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ, ไม่จำเป็นสำหรับ auth)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ MI แบบ user-assigned)

## การกระทำข้อมูลสมาชิก

OpenClaw เปิดเผยการกระทำ `member-info` ที่รองรับด้วย Graph สำหรับ Microsoft Teams เพื่อให้ agents และระบบอัตโนมัติสามารถ resolve รายละเอียดสมาชิกของ channel (ชื่อที่แสดง, อีเมล, บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อม admin consent

การกระทำนี้ถูกควบคุมโดย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลประจำตัวของ Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความ channel/group ล่าสุดที่จะถูกห่อเข้าไปใน prompt
- fallback ไปที่ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติ thread ที่ดึงมาจะถูกกรองด้วย allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการเติมบริบท thread จะมีเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาตเท่านั้น
- บริบทไฟล์แนบที่อ้างอิง (`ReplyTo*` ที่ได้มาจาก HTML การตอบกลับของ Teams) จะถูกส่งต่อในสภาพที่ได้รับในปัจจุบัน
- กล่าวอีกอย่างคือ allowlist ควบคุมว่าใครสามารถกระตุ้น agent ได้; ปัจจุบันมีเพียง path บริบทเสริมบางรายการเท่านั้นที่ถูกกรอง
- สามารถจำกัดประวัติ DM ได้ด้วย `channels.msteams.dmHistoryLimit` (turn ของผู้ใช้) การ override ต่อผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ของ Teams ปัจจุบัน (manifest)

ต่อไปนี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ใน manifest ของแอป Teams ของเรา สิทธิ์เหล่านี้ใช้ได้เฉพาะภายในทีม/chat ที่ติดตั้งแอปไว้เท่านั้น

**สำหรับ channels (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความ channel ทั้งหมดโดยไม่ต้อง @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับ group chats:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความ group chat ทั้งหมดโดยไม่ต้อง @mention

หากต้องการเพิ่มสิทธิ์ RSC ผ่าน Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## ตัวอย่าง manifest ของ Teams (ตัดข้อมูลบางส่วนออก)

ตัวอย่างขั้นต่ำที่ถูกต้องพร้อมฟิลด์ที่จำเป็น แทนที่ ID และ URL

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

### ข้อควรระวังเกี่ยวกับ manifest (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง** ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง** ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวม surface ที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- ต้องมี `bots[].supportsFiles: true` สำหรับการจัดการไฟล์ในขอบเขต personal
- `authorization.permissions.resourceSpecific` ต้องรวมการอ่าน/ส่งของ channel หากคุณต้องการทราฟฟิกของ channel

### การอัปเดตแอปที่มีอยู่

หากต้องการอัปเดตแอป Teams ที่ติดตั้งอยู่แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

หลังอัปเดตแล้ว ให้ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล และ **ปิด Teams อย่างสมบูรณ์แล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้าง metadata ของแอปที่แคชไว้

<details>
<summary>อัปเดต manifest ด้วยตนเอง (โดยไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัด zip ใหม่** สำหรับ manifest พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **Teams Admin Center:** แอป Teams → จัดการแอป → ค้นหาแอปของคุณ → อัปโหลดเวอร์ชันใหม่
   - **Sideload:** ใน Teams → แอป → จัดการแอปของคุณ → อัปโหลดแอปแบบกำหนดเอง

</details>

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อใช้ **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว, ไม่มีสิทธิ์ Graph API)

ใช้งานได้:

- อ่านเนื้อหา **ข้อความ** ของ channel
- ส่งเนื้อหา **ข้อความ** ของ channel
- รับไฟล์แนบ **personal (DM)**

ใช้งานไม่ได้:

- **รูปภาพหรือเนื้อหาไฟล์** ของ channel/group (เพย์โหลดมีเฉพาะ HTML stub)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจาก event Webhook สด)

### เมื่อใช้ **Teams RSC + สิทธิ์ Microsoft Graph Application**

เพิ่มความสามารถ:

- ดาวน์โหลด hosted contents (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความ channel/chat ผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ             | สิทธิ์ RSC             | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์** | ใช่ (ผ่าน Webhook)    | ไม่ (polling เท่านั้น)             |
| **ข้อความย้อนหลัง**     | ไม่                   | ใช่ (สามารถ query ประวัติได้)       |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ manifest ของแอป | ต้องมี admin consent + token flow |
| **ใช้งานได้ขณะออฟไลน์** | ไม่ (ต้องกำลังรันอยู่) | ใช่ (query ได้ทุกเมื่อ)            |

**สรุป:** RSC ใช้สำหรับการฟังแบบเรียลไทม์; Graph API ใช้สำหรับการเข้าถึงย้อนหลัง หากต้องการตามข้อความที่พลาดไปขณะออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมี admin consent)

## สื่อและประวัติที่เปิดใช้ Graph (จำเป็นสำหรับ channels)

หากคุณต้องการรูปภาพ/ไฟล์ใน **channels** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ admin consent

1. ใน **App Registration** ของ Entra ID (Azure AD) ให้เพิ่ม **Application permissions** ของ Microsoft Graph:
   - `ChannelMessage.Read.All` (ไฟล์แนบของ channel + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (group chats)
2. **ให้ admin consent** สำหรับ tenant
3. เพิ่มเวอร์ชัน **manifest** ของแอป Teams, อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ปิด Teams อย่างสมบูรณ์แล้วเปิดใหม่** เพื่อล้าง metadata ของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการ mention ผู้ใช้:** User @mentions ใช้งานได้ทันทีสำหรับผู้ใช้ในการสนทนา อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้ที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** แบบไดนามิก ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ admin consent

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน HTTP Webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับ LLM ที่ช้า) คุณอาจพบ:

- Gateway timeouts
- Teams ลองส่งข้อความซ้ำ (ทำให้เกิดรายการซ้ำ)
- การตอบกลับถูกทิ้ง

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งคำตอบในเชิงรุก แต่การตอบกลับที่ช้ามากยังอาจทำให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการซ้อนกัน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งงานนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลรับรองของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: รายการอนุญาตสำหรับข้อความโดยตรง (แนะนำให้ใช้ ID ออบเจ็กต์ AAD) ตัวช่วยตั้งค่าจะแปลงชื่อเป็น ID ระหว่างการตั้งค่าเมื่อมีสิทธิ์เข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้การจับคู่ UPN/ชื่อที่แสดงที่เปลี่ยนแปลงได้ และการกำหนดเส้นทางโดยตรงด้วยชื่อทีม/ช่องทางอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดส่วนข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนการแบ่งตามความยาว
- `channels.msteams.mediaAllowHosts`: รายการอนุญาตสำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: รายการอนุญาตสำหรับแนบส่วนหัว Authorization เมื่อพยายามดึงสื่อซ้ำ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: กำหนดให้ต้อง @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การแทนที่ต่อทีม
- `channels.msteams.teams.<teamId>.requireMention`: การแทนที่ต่อทีม
- `channels.msteams.teams.<teamId>.tools`: การแทนที่นโยบายเครื่องมือต่อทีมเริ่มต้น (`allow`/`deny`/`alsoAllow`) ที่ใช้เมื่อไม่มีการแทนที่ของช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: การแทนที่นโยบายเครื่องมือต่อผู้ส่งต่อทีมเริ่มต้น (รองรับไวลด์การ์ด `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การแทนที่ต่อช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การแทนที่ต่อช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การแทนที่นโยบายเครื่องมือต่อช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การแทนที่นโยบายเครื่องมือต่อผู้ส่งต่อช่องทาง (รองรับไวลด์การ์ด `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปกับ `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดการทำงานข้อมูลสมาชิกที่ใช้ Graph รองรับ (ค่าเริ่มต้น: เปิดเมื่อมีข้อมูลรับรอง Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน - `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: เส้นทางไปยังไฟล์ใบรับรอง PEM (federated + certificate auth)
- `channels.msteams.certificateThumbprint`: thumbprint ของใบรับรอง (ไม่บังคับ ไม่จำเป็นสำหรับ auth)
- `channels.msteams.useManagedIdentity`: เปิดใช้ auth ด้วย managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: ID ไคลเอนต์สำหรับ managed identity ที่ผู้ใช้กำหนด
- `channels.msteams.sharePointSiteId`: ID ไซต์ SharePoint สำหรับการอัปโหลดไฟล์ในแชตกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบมาตรฐานของเอเจนต์ (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความโดยตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ ID การสนทนา:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดกับโพสต์

Teams เพิ่งเพิ่มรูปแบบ UI ช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                    | คำอธิบาย                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **โพสต์** (คลาสสิก)      | ข้อความแสดงเป็นการ์ดพร้อมการตอบกลับแบบเธรดอยู่ด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **เธรด** (คล้าย Slack) | ข้อความไหลต่อเนื่องเป็นเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องทางใช้รูปแบบ UI แบบใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางรูปแบบเธรด → การตอบกลับจะปรากฏซ้อนกันอย่างไม่ลงตัว
- `top-level` ในช่องทางรูปแบบโพสต์ → การตอบกลับจะปรากฏเป็นโพสต์ระดับบนแยกกันแทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนดค่า `replyStyle` ต่อช่องทางตามวิธีตั้งค่าช่องทางนั้น:

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

- **ข้อความโดยตรง:** รูปภาพและไฟล์แนบทำงานผ่าน Teams bot file APIs
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในที่เก็บข้อมูล M365 (SharePoint/OneDrive) เพย์โหลด Webhook มีเพียง HTML stub ไม่ใช่ไบต์ของไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งที่เน้นไฟล์โดยชัดเจน ให้ใช้ `action=upload-file` พร้อม `media` / `filePath` / `path`; `message` ที่ไม่บังคับจะกลายเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` จะแทนที่ชื่อที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความช่องทางที่มีรูปภาพจะถูกรับเป็นข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
ตามค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น แทนที่ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
ส่วนหัว Authorization จะแนบเฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework) รักษารายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบหลาย tenant)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ในข้อความโดยตรงโดยใช้โฟลว์ FileConsentCard (มีมาให้ในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่ต้องมี                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **ข้อความโดยตรง**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **แชตกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องมี `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | เข้ารหัสแบบ Base64 inline                        | ใช้งานได้ทันที                            |

### ทำไมแชตกลุ่มจึงต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (endpoint Graph API `/me/drive` ใช้ไม่ได้กับตัวตนของแอปพลิเคชัน) หากต้องการส่งไฟล์ในแชตกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์สำหรับแชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ เปิดใช้ลิงก์แชร์รายผู้ใช้

2. **ให้ความยินยอมของผู้ดูแลระบบ** สำหรับ tenant

3. **รับ ID ไซต์ SharePoint ของคุณ:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **กำหนดค่า OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### พฤติกรรมการแชร์

| สิทธิ์                              | พฤติกรรมการแชร์                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` เท่านั้น              | ลิงก์แชร์ทั่วทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกแชตเท่านั้นที่เข้าถึงได้)      |

การแชร์รายผู้ใช้ปลอดภัยกว่า เพราะมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะถอยกลับไปใช้การแชร์ทั่วทั้งองค์กร

### พฤติกรรมสำรอง

| สถานการณ์                                          | ผลลัพธ์                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์            |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลด OneDrive (อาจล้มเหลว), ส่งเฉพาะข้อความ |
| แชตส่วนตัว + ไฟล์                              | โฟลว์ FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint)    |
| ทุกบริบท + รูปภาพ                               | เข้ารหัสแบบ Base64 inline (ทำงานได้โดยไม่ต้องใช้ SharePoint)   |

### ตำแหน่งที่เก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกเก็บในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพล Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบ native)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Gateway บันทึกคะแนนโหวตไว้ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลยังไม่โพสต์สรุปผลลัพธ์โดยอัตโนมัติ (ตรวจดูไฟล์ที่เก็บหากจำเป็น)

## การ์ดงานนำเสนอ

ส่งเพย์โหลดงานนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนาใน Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญางานนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` ข้อความของเมสเสจเป็นค่าไม่บังคับ

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

สำหรับรายละเอียดรูปแบบเป้าหมาย ดู [รูปแบบเป้าหมาย](#target-formats) ด้านล่าง

## รูปแบบเป้าหมาย

เป้าหมาย MSTeams ใช้คำนำหน้าเพื่อแยกความแตกต่างระหว่างผู้ใช้และการสนทนา:

| ประเภทเป้าหมาย         | รูปแบบ                           | ตัวอย่าง                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)      | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)              |
| กลุ่ม/ช่องทาง       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/ช่องทาง (ดิบ) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`) |

**ตัวอย่าง CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**ตัวอย่างเครื่องมือของเอเจนต์:**

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

<Note>
หากไม่มีคำนำหน้า `user:` ระบบจะใช้ค่าเริ่มต้นเป็นการแก้ไขชื่อแบบกลุ่มหรือทีม ใช้ `user:` เสมอเมื่อกำหนดเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกทำได้เฉพาะ **หลังจาก** ผู้ใช้มีปฏิสัมพันธ์แล้วเท่านั้น เพราะเราจะจัดเก็บข้อมูลอ้างอิงการสนทนา ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมผ่าน allowlist

## รหัสทีมและช่อง (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์คำค้น `groupId` ใน URL ของ Teams **ไม่ใช่** รหัสทีมที่ใช้สำหรับการกำหนดค่า ให้แยกรหัสจากพาธของ URL แทน:

**URL ของทีม:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL ของช่อง:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**สำหรับการกำหนดค่า:**

- คีย์ของทีม = ส่วนพาธหลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`; tenant รุ่นเก่าอาจแสดง `@thread.skype` ซึ่งใช้ได้เช่นกัน)
- คีย์ของช่อง = ส่วนพาธหลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ละเว้น** พารามิเตอร์คำค้น `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw เพราะเป็นรหัสกลุ่ม Microsoft Entra ไม่ใช่รหัสการสนทนา Bot Framework ที่ใช้ในกิจกรรมขาเข้าของ Teams

## ช่องส่วนตัว

บอตรองรับช่องส่วนตัวอย่างจำกัด:

| ฟีเจอร์                      | ช่องมาตรฐาน | ช่องส่วนตัว       |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอต             | ใช่               | จำกัด                |
| ข้อความแบบเรียลไทม์ (webhook) | ใช่               | อาจไม่ทำงาน           |
| สิทธิ์ RSC              | ใช่               | อาจมีพฤติกรรมแตกต่าง |
| @mentions                    | ใช่               | หากบอตเข้าถึงได้   |
| ประวัติ Graph API            | ใช่               | ใช่ (เมื่อมีสิทธิ์) |

**วิธีแก้ไขหากช่องส่วนตัวไม่ทำงาน:**

1. ใช้ช่องมาตรฐานสำหรับการโต้ตอบกับบอต
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความถึงบอตโดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงประวัติ (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในช่อง:** สิทธิ์ Graph หรือความยินยอมจากผู้ดูแลระบบหายไป ติดตั้งแอป Teams ใหม่ แล้วออกจาก Teams ให้สมบูรณ์และเปิดใหม่
- **ไม่มีการตอบกลับในช่อง:** โดยค่าเริ่มต้นต้องมีการ mention; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่ารายทีม/ช่อง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบและเพิ่มแอปอีกครั้ง แล้วออกจาก Teams ให้สมบูรณ์เพื่อรีเฟรช
- **401 Unauthorized จาก webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT หมายความว่า endpoint เข้าถึงได้แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ สร้างไอคอน PNG ที่ถูกต้อง (`outline.png` ขนาด 32x32, `color.png` ขนาด 192x192)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชตอื่น ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การเปลี่ยนแปลงเผยแพร่
- **"Something went wrong" ระหว่างอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบเนื้อหาการตอบกลับเพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" ซึ่งมักหลีกเลี่ยงข้อจำกัดของ sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตทุกตัวอักษร
2. อัปโหลดแอปอีกครั้งและติดตั้งใหม่ในทีม/แชต
3. ตรวจสอบว่าผู้ดูแลระบบองค์กรของคุณบล็อกสิทธิ์ RSC หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม, `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## เอกสารอ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมา manifest ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความช่องด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [เอกสารอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอต Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (ช่อง/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอต

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels) - ช่องทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
