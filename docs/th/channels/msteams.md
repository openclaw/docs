---
read_when:
    - การทำงานเกี่ยวกับฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams, ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความ + ไฟล์แนบ DM; การส่งไฟล์ในช่อง/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats)) โพลจะถูกส่งผ่าน Adaptive Cards การทำงานกับข้อความเปิดเผย `upload-file` แบบชัดเจนสำหรับการส่งที่เริ่มจากไฟล์

## Plugin ที่รวมมาด้วย

Microsoft Teams มาพร้อมเป็น Plugin ที่รวมมาด้วยในรุ่น OpenClaw ปัจจุบัน ดังนั้นในบิลด์แพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ที่มาพร้อมแพ็กเกจ ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้แพ็กเกจเปล่าเพื่อตามแท็กรีลีสทางการปัจจุบัน ปักหมุดเวอร์ชันแบบเจาะจงเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

เช็กเอาต์ในเครื่อง (เมื่อรันจาก repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอท การสร้าง manifest และการสร้างข้อมูลประจำตัวได้ในคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI ขณะนี้อยู่ในสถานะพรีวิว คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรีลีสได้
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
ต้องใช้ `--allow-anonymous` เพราะ Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ คำขอบอทขาเข้าแต่ละรายการยังคงถูกตรวจสอบโดย Teams SDK โดยอัตโนมัติ
</Note>

ทางเลือก: `ngrok http 3978` หรือ `tailscale funnel 3978` (แต่สิ่งเหล่านี้อาจเปลี่ยน URL ในแต่ละเซสชัน)

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
- ลงทะเบียนบอท (จัดการโดย Teams ตามค่าเริ่มต้น - ไม่ต้องใช้การสมัครใช้งาน Azure)

เอาต์พุตจะแสดง `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** - จดค่าเหล่านี้ไว้สำหรับขั้นตอนถัดไป นอกจากนี้ยังเสนอให้ติดตั้งแอปใน Teams โดยตรงด้วย

**4. กำหนดค่า OpenClaw** โดยใช้ข้อมูลประจำตัวจากเอาต์พุต:

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

`teams app create` จะแจ้งให้คุณติดตั้งแอป - เลือก "Install in Teams" หากคุณข้ามขั้นตอนนี้ คุณสามารถรับลิงก์ภายหลังได้:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงาน**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้รันการวินิจฉัยครอบคลุมการลงทะเบียนบอท การกำหนดค่าแอป AAD ความถูกต้องของ manifest และการตั้งค่า SSO

สำหรับการปรับใช้โปรดักชัน พิจารณาใช้ [การยืนยันตัวตนแบบ federated](/th/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificate หรือ managed identity) แทน client secrets

<Note>
แชตกลุ่มถูกบล็อกตามค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ต้องถูกกล่าวถึงก่อน)
</Note>

## เป้าหมาย

- คุยกับ OpenClaw ผ่าน DM, แชตกลุ่ม หรือช่องใน Teams
- ทำให้การกำหนดเส้นทางเป็นแบบกำหนดได้แน่นอน: การตอบกลับจะกลับไปยังช่องที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมช่องที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องมีการกล่าวถึง เว้นแต่กำหนดค่าไว้เป็นอย่างอื่น)

## การเขียนค่า config

ตามค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดต config ที่ถูกทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object IDs ที่เสถียร
- อย่าพึ่งพาการจับคู่ UPN/ชื่อที่แสดงสำหรับ allowlists - ค่าเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงตามค่าเริ่มต้น; เลือกเปิดใช้อย่างชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- วิซาร์ดสามารถแปลงชื่อเป็น IDs ผ่าน Microsoft Graph เมื่อข้อมูลประจำตัวอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อกเว้นแต่คุณเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งใดสามารถทริกเกอร์ในแชตกลุ่ม/ช่องได้ (fallback ไปที่ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ยังต้องถูกกล่าวถึงตามค่าเริ่มต้น)
- หากต้องการไม่อนุญาต **ช่องใดเลย** ให้ตั้งค่า `channels.msteams.groupPolicy: "disabled"`

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

**Teams + allowlist ของช่อง**

- จำกัดขอบเขตการตอบกลับของกลุ่ม/ช่องด้วยการระบุ teams และ channels ใต้ `channels.msteams.teams`
- คีย์ควรใช้ Teams conversation IDs ที่เสถียรจากลิงก์ Teams ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนได้
- เมื่อ `groupPolicy="allowlist"` และมี allowlist ของ teams อยู่ ระบบจะยอมรับเฉพาะ teams/channels ที่ระบุไว้เท่านั้น (ต้องถูกกล่าวถึง)
- วิซาร์ดการกำหนดค่ารับรายการ `Team/Channel` และจัดเก็บให้คุณ
- เมื่อเริ่มต้น OpenClaw จะแปลงชื่อ team/channel และ user allowlist เป็น IDs (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping ลง log; ชื่อ team/channel ที่แปลงไม่ได้จะถูกเก็บไว้ตามที่พิมพ์ แต่ถูกเพิกเฉยสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น เว้นแต่เปิดใช้งาน `channels.msteams.dangerouslyAllowNameMatching: true`

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
<summary><strong>การตั้งค่าแบบแมนนวล (โดยไม่ใช้ Teams CLI)</strong></summary>

หากคุณใช้ Teams CLI ไม่ได้ คุณสามารถตั้งค่าบอทด้วยตนเองผ่าน Azure Portal

### วิธีการทำงาน

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน (รวมมาด้วยในรีลีสปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **Teams app package** ที่อ้างอิงบอทและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams เข้าใน team (หรือขอบเขตส่วนตัวสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) และเริ่ม Gateway
6. Gateway จะรับทราฟฟิก Bot Framework webhook ที่ `/api/messages` ตามค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | ฟิลด์ | ค่า |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอทของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือกการสมัครใช้งาน Azure ของคุณ |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่ |
   | **Pricing tier**   | **Free** สำหรับ dev/testing |
   | **Type of App**    | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง) |
   | **Creation type**  | **Create new Microsoft App ID** |

<Warning>
การสร้างบอทแบบ multi-tenant ใหม่ถูกเลิกใช้หลัง 2025-07-31 ใช้ **Single Tenant** สำหรับบอทใหม่
</Warning>

3. คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลประจำตัว

1. ไปที่ทรัพยากร Azure Bot ของคุณ → **Configuration**
2. คัดลอก **Microsoft App ID** → ค่านี้คือ `appId` ของคุณ
3. คลิก **Manage Password** → ไปที่ App Registration
4. ใต้ **Certificates & secrets** → **New client secret** → คัดลอก **Value** → ค่านี้คือ `appPassword` ของคุณ
5. ไปที่ **Overview** → คัดลอก **Directory (tenant) ID** → ค่านี้คือ `tenantId` ของคุณ

### ขั้นตอนที่ 3: กำหนดค่า Messaging Endpoint

1. ใน Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint** เป็น Webhook URL ของคุณ:
   - โปรดักชัน: `https://your-domain.com/api/messages`
   - การพัฒนาในเครื่อง: ใช้ tunnel (ดู [การพัฒนาในเครื่อง](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้ช่อง Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับข้อกำหนดการให้บริการ

### ขั้นตอนที่ 5: สร้าง Teams App Manifest

- รวมรายการ `bot` ที่มี `botId = <App ID>`
- ขอบเขต: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขต personal)
- เพิ่มสิทธิ์ RSC (ดู [สิทธิ์ RSC](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- zip ทั้งสามไฟล์เข้าด้วยกัน: `manifest.json`, `outline.png`, `color.png`

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

ช่อง Teams จะเริ่มโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและมี config `msteams` พร้อมข้อมูลประจำตัว

</details>

## การยืนยันตัวตนแบบ federated (certificate plus managed identity)

> เพิ่มใน 2026.4.11

สำหรับการปรับใช้โปรดักชัน OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่า client secrets มีสองวิธีให้ใช้:

### ตัวเลือก A: การยืนยันตัวตนด้วย certificate

ใช้ PEM certificate ที่ลงทะเบียนกับ app registration ของ Entra ID ของคุณ

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

**ตัวแปรสภาพแวดล้อม:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### ตัวเลือก B: Azure Managed Identity

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน วิธีนี้เหมาะสำหรับการปรับใช้บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity พร้อมใช้งาน

**วิธีการทำงาน:**

1. pod/VM ของบอทมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity กับ app registration ของ Entra ID
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับโทเคนจาก Azure IMDS endpoint (`169.254.169.254`)
4. โทเคนถูกส่งให้ Teams SDK สำหรับการยืนยันตัวตนของบอท

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- federated identity credential ที่สร้างบน app registration ของ Entra ID
- การเข้าถึงเครือข่ายไปยัง IMDS (`169.254.169.254:80`) จาก pod/VM

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

**การกำหนดค่า (ข้อมูลประจำตัวที่มีการจัดการแบบกำหนดโดยผู้ใช้):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะแบบกำหนดโดยผู้ใช้)

### การตั้งค่า AKS Workload Identity

สำหรับการปรับใช้ AKS ที่ใช้ workload identity:

1. **เปิดใช้ workload identity** บนคลัสเตอร์ AKS ของคุณ
2. **สร้างข้อมูลประจำตัวแบบสหพันธ์** บนการลงทะเบียนแอป Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **ใส่คำอธิบายประกอบให้บัญชีบริการ Kubernetes** ด้วย ID ไคลเอ็นต์ของแอป:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **ติดป้ายกำกับ pod** สำหรับการฉีด workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้มีการเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) - หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการตรวจสอบสิทธิ์

| วิธี | การกำหนดค่า | ข้อดี | ข้อเสีย |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret** | `appPassword` | ตั้งค่าง่าย | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า |
| **ใบรับรอง** | `authType: "federated"` + `certificatePath` | ไม่มี shared secret ผ่านเครือข่าย | มีภาระในการจัดการใบรับรอง |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่าน, ไม่มี secret ให้จัดการ | ต้องมีโครงสร้างพื้นฐาน Azure |

**ลักษณะการทำงานเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การตรวจสอบสิทธิ์แบบ client secret เป็นค่าเริ่มต้น การกำหนดค่าที่มีอยู่จะยังใช้งานได้ต่อไปโดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (การทำ tunnel)

Teams เข้าถึง `localhost` ไม่ได้ ใช้ dev tunnel แบบถาวรเพื่อให้ URL ของคุณคงเดิมข้ามเซสชัน:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละเซสชัน)

หาก URL ของ tunnel เปลี่ยน ให้อัปเดต endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## การทดสอบ Bot

**เรียกใช้การวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียน bot, แอป AAD, manifest และการกำหนดค่า SSO ในรอบเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ใช้ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหา bot ใน Teams แล้วส่ง DM
3. ตรวจสอบบันทึก Gateway สำหรับกิจกรรมขาเข้า

## ตัวแปรสภาพแวดล้อม

คีย์การกำหนดค่าทั้งหมดสามารถตั้งค่าผ่านตัวแปรสภาพแวดล้อมแทนได้:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ, ไม่จำเป็นสำหรับการตรวจสอบสิทธิ์)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ MI แบบกำหนดโดยผู้ใช้)

## การดำเนินการข้อมูลสมาชิก

OpenClaw เปิดเผยการดำเนินการ `member-info` ที่อิง Graph สำหรับ Microsoft Teams เพื่อให้ agent และระบบอัตโนมัติสามารถแก้รายละเอียดสมาชิกช่องทาง (ชื่อที่แสดง, อีเมล, บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อมความยินยอมจากผู้ดูแลระบบ

การดำเนินการนี้ถูกควบคุมด้วย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลประจำตัว Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความช่องทาง/กลุ่มล่าสุดที่จะถูกห่อรวมเข้าใน prompt
- ถอยกลับไปใช้ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองด้วย allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการป้อนบริบทเธรดตั้งต้นจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาตเท่านั้น
- บริบทไฟล์แนบที่อ้างอิง (`ReplyTo*` ที่ได้มาจาก HTML การตอบกลับของ Teams) ขณะนี้จะถูกส่งผ่านตามที่ได้รับ
- กล่าวอีกอย่างคือ allowlist ควบคุมว่าใครสามารถเรียก agent ได้ ปัจจุบันมีเพียงเส้นทางบริบทเสริมเฉพาะบางส่วนเท่านั้นที่ถูกกรอง
- สามารถจำกัดประวัติ DM ได้ด้วย `channels.msteams.dmHistoryLimit` (turn ของผู้ใช้) การแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ของ Teams ปัจจุบัน (manifest)

ต่อไปนี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ใน manifest ของแอป Teams ของเรา สิทธิ์เหล่านี้ใช้ได้เฉพาะภายในทีม/แชทที่ติดตั้งแอปเท่านั้น

**สำหรับช่องทาง (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความช่องทางทั้งหมดโดยไม่ต้อง @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับแชทกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความแชทกลุ่มทั้งหมดโดยไม่ต้อง @mention

หากต้องการเพิ่มสิทธิ์ RSC ผ่าน Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## ตัวอย่าง manifest ของ Teams (ปกปิดข้อมูลแล้ว)

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

### ข้อควรระวังของ manifest (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง** ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง** ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวมพื้นผิวที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- ต้องมี `bots[].supportsFiles: true` สำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล
- `authorization.permissions.resourceSpecific` ต้องรวมการอ่าน/ส่งของช่องทาง หากคุณต้องการทราฟฟิกช่องทาง

### การอัปเดตแอปที่มีอยู่

หากต้องการอัปเดตแอป Teams ที่ติดตั้งแล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

หลังอัปเดต ให้ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล และ **ออกจาก Teams ทั้งหมดแล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

<details>
<summary>การอัปเดต manifest ด้วยตนเอง (ไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัด zip ใหม่** สำหรับ manifest พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **Teams Admin Center:** แอป Teams → จัดการแอป → ค้นหาแอปของคุณ → อัปโหลดเวอร์ชันใหม่
   - **Sideload:** ใน Teams → แอป → จัดการแอปของคุณ → อัปโหลดแอปแบบกำหนดเอง

</details>

## ความสามารถ: RSC เท่านั้น เทียบกับ Graph

### เมื่อใช้ **Teams RSC เท่านั้น** (ติดตั้งแอปแล้ว, ไม่มีสิทธิ์ Graph API)

ใช้งานได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความช่องทาง
- ส่งเนื้อหา **ข้อความ** ของข้อความช่องทาง
- รับไฟล์แนบ **ส่วนบุคคล (DM)**

ใช้งานไม่ได้:

- **เนื้อหารูปภาพหรือไฟล์** ในช่องทาง/กลุ่ม (payload มีเฉพาะ HTML stub)
- การดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- การอ่านประวัติข้อความ (นอกเหนือจากเหตุการณ์ Webhook สด)

### เมื่อใช้ **Teams RSC + สิทธิ์ Microsoft Graph Application**

เพิ่ม:

- การดาวน์โหลด hosted contents (รูปภาพที่วางลงในข้อความ)
- การดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- การอ่านประวัติข้อความช่องทาง/แชทผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ | สิทธิ์ RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์** | ใช่ (ผ่าน Webhook) | ไม่ (polling เท่านั้น) |
| **ข้อความย้อนหลัง** | ไม่ | ใช่ (สามารถ query ประวัติได้) |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ manifest ของแอป | ต้องมีความยินยอมจากผู้ดูแลระบบ + token flow |
| **ทำงานแบบออฟไลน์** | ไม่ (ต้องกำลังทำงานอยู่) | ใช่ (query ได้ทุกเวลา) |

**สรุป:** RSC ใช้สำหรับการรับฟังแบบเรียลไทม์ Graph API ใช้สำหรับการเข้าถึงย้อนหลัง หากต้องการตามข้อความที่พลาดไประหว่างออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมีความยินยอมจากผู้ดูแลระบบ)

## สื่อและประวัติที่เปิดใช้ Graph (จำเป็นสำหรับช่องทาง)

หากคุณต้องการรูปภาพ/ไฟล์ใน **ช่องทาง** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ความยินยอมจากผู้ดูแลระบบ

1. ใน **App Registration** ของ Entra ID (Azure AD) ให้เพิ่ม **สิทธิ์ Application** ของ Microsoft Graph:
   - `ChannelMessage.Read.All` (ไฟล์แนบช่องทาง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชทกลุ่ม)
2. **ให้ความยินยอมจากผู้ดูแลระบบ** สำหรับ tenant
3. เพิ่มเวอร์ชัน **manifest** ของแอป Teams, อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ออกจาก Teams ทั้งหมดแล้วเปิดใหม่** เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการกล่าวถึงผู้ใช้:** User @mentions ใช้งานได้ทันทีสำหรับผู้ใช้ในการสนทนา อย่างไรก็ตาม หากคุณต้องการค้นหาและกล่าวถึงผู้ใช้แบบไดนามิกที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมจากผู้ดูแลระบบ

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน HTTP Webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับจาก LLM ช้า) คุณอาจเห็น:

- Gateway หมดเวลา
- Teams ลองส่งข้อความใหม่ (ทำให้เกิดข้อความซ้ำ)
- การตอบกลับถูกทิ้ง

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งการตอบกลับเชิงรุก แต่การตอบกลับที่ช้ามากก็ยังอาจก่อปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลประจำตัวของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: รายการอนุญาต DM (แนะนำให้ใช้ AAD object ID) ตัวช่วยตั้งค่าจะแปลงชื่อเป็น ID ระหว่างการตั้งค่าเมื่อมีสิทธิ์เข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดการจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางตามชื่อทีม/ช่องทางโดยตรงอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดชิ้นข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.msteams.mediaAllowHosts`: รายการอนุญาตสำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: รายการอนุญาตสำหรับแนบส่วนหัว Authorization ในการลองสื่อซ้ำ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: ต้องมี @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: ค่าแทนที่รายทีม
- `channels.msteams.teams.<teamId>.requireMention`: ค่าแทนที่รายทีม
- `channels.msteams.teams.<teamId>.tools`: ค่าแทนที่นโยบายเครื่องมือเริ่มต้นรายทีม (`allow`/`deny`/`alsoAllow`) ใช้เมื่อไม่มีค่าแทนที่ระดับช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: ค่าแทนที่นโยบายเครื่องมือเริ่มต้นรายทีมรายผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ค่าแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ค่าแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: ค่าแทนที่นโยบายเครื่องมือรายช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: ค่าแทนที่นโยบายเครื่องมือรายช่องทางรายผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (คีย์แบบเก่าที่ไม่มีคำนำหน้ายังคงแมปไปที่ `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดแอ็กชันข้อมูลสมาชิกที่ใช้ Graph เป็นฐาน (ค่าเริ่มต้น: เปิดเมื่อมีข้อมูลประจำตัว Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน - `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (federated + certificate auth)
- `channels.msteams.certificateThumbprint`: ลายนิ้วมือใบรับรอง (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `channels.msteams.useManagedIdentity`: เปิดใช้การยืนยันตัวตนด้วย managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ managed identity ที่ผู้ใช้กำหนด
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชตกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบเอเจนต์มาตรฐาน (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความโดยตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดเทียบกับโพสต์

Teams เพิ่งเพิ่มรูปแบบ UI ช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                    | คำอธิบาย                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **โพสต์** (คลาสสิก)      | ข้อความแสดงเป็นการ์ดพร้อมการตอบกลับแบบเธรดด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **เธรด** (คล้าย Slack) | ข้อความไหลเรียงเป็นเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องทางใช้รูปแบบ UI ใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางรูปแบบเธรด → การตอบกลับจะแสดงซ้อนกันอย่างไม่เป็นธรรมชาติ
- `top-level` ในช่องทางรูปแบบโพสต์ → การตอบกลับจะแสดงเป็นโพสต์ระดับบนสุดแยกต่างหากแทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนดค่า `replyStyle` รายช่องทางตามวิธีตั้งค่าช่องทางนั้น:

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

### ลำดับความสำคัญในการแก้ค่า

เมื่อบอตส่งการตอบกลับเข้าไปในช่องทาง `replyStyle` จะถูกแก้ค่าจากค่าแทนที่ที่เฉพาะเจาะจงที่สุดลงไปจนถึงค่าเริ่มต้น ค่าแรกที่ไม่ใช่ `undefined` จะถูกใช้:

1. **รายช่องทาง** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **รายทีม** — `channels.msteams.teams.<teamId>.replyStyle`
3. **ทั่วทั้งระบบ** — `channels.msteams.replyStyle`
4. **ค่าเริ่มต้นโดยนัย** — อนุมานจาก `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

หากคุณตั้งค่า `requireMention: false` ทั่วทั้งระบบโดยไม่มี `replyStyle` ที่ชัดเจน การกล่าวถึงในช่องทางรูปแบบโพสต์จะแสดงเป็นโพสต์ระดับบนสุด แม้ข้อความขาเข้าจะเป็นการตอบกลับในเธรดก็ตาม ปัก `replyStyle: "thread"` ไว้ที่ระดับทั่วทั้งระบบ ทีม หรือช่องทางเพื่อหลีกเลี่ยงพฤติกรรมที่ไม่คาดคิด

### การรักษาบริบทเธรด

เมื่อ `replyStyle: "thread"` มีผลและบอตถูก @mentioned จากภายในเธรดของช่องทาง OpenClaw จะแนบ root ของเธรดเดิมกลับเข้าไปในข้อมูลอ้างอิงการสนทนาขาออก (`19:…@thread.tacv2;messageid=<root>`) เพื่อให้การตอบกลับไปอยู่ในเธรดเดียวกัน สิ่งนี้ใช้ได้ทั้งการส่งแบบสด (ในเทิร์นเดียวกัน) และการส่งเชิงรุกที่ทำหลังจากบริบทเทิร์นของ Bot Framework หมดอายุแล้ว (เช่น เอเจนต์ที่รันนาน, การตอบกลับ tool-call ที่เข้าคิวผ่าน `mcp__openclaw__message`)

root ของเธรดจะมาจาก `threadId` ที่จัดเก็บไว้ในข้อมูลอ้างอิงการสนทนา ข้อมูลอ้างอิงที่จัดเก็บไว้รุ่นเก่าซึ่งมีมาก่อน `threadId` จะ fallback ไปที่ `activityId` (กิจกรรมขาเข้าใดก็ตามที่เริ่มต้นการสนทนาครั้งล่าสุด) ดังนั้นการติดตั้งใช้งานเดิมจึงยังทำงานต่อได้โดยไม่ต้องเริ่มต้นใหม่

เมื่อ `replyStyle: "top-level"` มีผล ข้อความขาเข้าจากเธรดของช่องทางจะตั้งใจตอบเป็นโพสต์ระดับบนสุดใหม่ โดยไม่แนบท้ายเธรด นี่เป็นพฤติกรรมที่ถูกต้องสำหรับช่องทางรูปแบบเธรด หากคุณเห็นโพสต์ระดับบนสุดในที่ที่คาดว่าจะเป็นการตอบกลับแบบเธรด แสดงว่า `replyStyle` ของช่องทางนั้นตั้งค่าไม่ถูกต้อง

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DM:** รูปภาพและไฟล์แนบทำงานผ่าน Teams bot file APIs
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในที่จัดเก็บ M365 (SharePoint/OneDrive) payload ของ Webhook มีเฉพาะ stub HTML ไม่ใช่ไบต์ไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งที่ระบุไฟล์เป็นหลักอย่างชัดเจน ให้ใช้ `action=upload-file` พร้อม `media` / `filePath` / `path`; `message` ที่ไม่บังคับจะกลายเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` จะแทนที่ชื่อที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความช่องทางที่มีรูปภาพจะถูกรับเป็นข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
โดยค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น แทนที่ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตโฮสต์ใดก็ได้)
ส่วนหัว Authorization จะแนบเฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework) เก็บรายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบหลาย tenant)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ใน DM โดยใช้ flow FileConsentCard (มีในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่ต้องใช้                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **แชตกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องมี `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | เข้ารหัส Base64 แบบอินไลน์                        | ใช้งานได้ทันที                            |

### เหตุผลที่แชตกลุ่มต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (endpoint Graph API `/me/drive` ใช้กับ identity ของแอปพลิเคชันไม่ได้) หากต้องการส่งไฟล์ในแชตกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ เปิดใช้ลิงก์แชร์รายผู้ใช้

2. **ให้ความยินยอมของผู้ดูแลระบบ** สำหรับ tenant

3. **รับ SharePoint site ID ของคุณ:**

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกแชตเข้าถึงได้)      |

การแชร์รายผู้ใช้ปลอดภัยกว่า เพราะมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback ไปใช้การแชร์ทั่วทั้งองค์กร

### พฤติกรรม fallback

| สถานการณ์                                          | ผลลัพธ์                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์            |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลด OneDrive (อาจล้มเหลว), ส่งเฉพาะข้อความ |
| แชตส่วนตัว + ไฟล์                              | flow FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint)    |
| ทุกบริบท + รูปภาพ                               | เข้ารหัส Base64 แบบอินไลน์ (ทำงานได้โดยไม่ต้องใช้ SharePoint)   |

### ตำแหน่งที่จัดเก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกจัดเก็บในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพล Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบเนทีฟ)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- คะแนนโหวตถูกบันทึกโดย Gateway ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลยังไม่โพสต์สรุปผลโดยอัตโนมัติ (ตรวจสอบไฟล์ store หากจำเป็น)

## การ์ดการนำเสนอ

ส่งเพย์โหลดการนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนา Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` ข้อความของ message จะเป็นค่าที่ไม่บังคับ

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

สำหรับรายละเอียดรูปแบบเป้าหมาย โปรดดู [รูปแบบเป้าหมาย](#target-formats) ด้านล่าง

## รูปแบบเป้าหมาย

เป้าหมาย MSTeams ใช้คำนำหน้าเพื่อแยกผู้ใช้กับการสนทนาออกจากกัน:

| ประเภทเป้าหมาย         | รูปแบบ                           | ตัวอย่าง                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)      | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)              |
| กลุ่ม/ช่อง       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/ช่อง (ดิบ) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (ถ้ามี `@thread`) |

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

<Note>
หากไม่มีคำนำหน้า `user:` ชื่อจะใช้การ resolve แบบกลุ่มหรือทีมเป็นค่าเริ่มต้น ใช้ `user:` เสมอเมื่อกำหนดเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกทำได้เฉพาะ **หลังจาก** ผู้ใช้มีการโต้ตอบแล้วเท่านั้น เพราะเราจะจัดเก็บการอ้างอิงการสนทนา ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมด้วยรายการอนุญาต

## ID ของทีมและช่อง (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์คิวรี `groupId` ใน URL ของ Teams **ไม่ใช่** ID ทีมที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จาก path ของ URL แทน:

**URL ทีม:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL ช่อง:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**สำหรับ config:**

- คีย์ทีม = ส่วน path หลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`; เทนเนนต์เก่าอาจแสดง `@thread.skype` ซึ่งใช้ได้เช่นกัน)
- คีย์ช่อง = ส่วน path หลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ละเว้น** พารามิเตอร์คิวรี `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw นี่คือ ID กลุ่ม Microsoft Entra ไม่ใช่ Bot Framework conversation ID ที่ใช้ในกิจกรรม Teams ขาเข้า

## ช่องส่วนตัว

บอทรองรับช่องส่วนตัวได้จำกัด:

| ฟีเจอร์                      | ช่องมาตรฐาน | ช่องส่วนตัว       |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอท             | ได้               | จำกัด                |
| ข้อความแบบเรียลไทม์ (Webhook) | ได้               | อาจไม่ทำงาน           |
| สิทธิ์ RSC              | ได้               | อาจทำงานต่างออกไป |
| @mentions                    | ได้               | ถ้าบอทเข้าถึงได้   |
| ประวัติ Graph API            | ได้               | ได้ (เมื่อมีสิทธิ์) |

**วิธีเลี่ยงเมื่อช่องส่วนตัวไม่ทำงาน:**

1. ใช้ช่องมาตรฐานสำหรับการโต้ตอบกับบอท
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความถึงบอทโดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงประวัติ (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาทั่วไป

- **รูปภาพไม่แสดงในช่อง:** ไม่มีสิทธิ์ Graph หรือการยินยอมจากผู้ดูแลระบบ ติดตั้งแอป Teams ใหม่และปิด Teams ให้สนิทแล้วเปิดใหม่
- **ไม่มีการตอบกลับในช่อง:** ค่าเริ่มต้นต้องมีการ mention; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าตามทีม/ช่อง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบ + เพิ่มแอปกลับเข้าไปใหม่ และปิด Teams ให้สนิทเพื่อรีเฟรช
- **401 Unauthorized จาก Webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายความว่า endpoint เข้าถึงได้ แต่ auth ล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ สร้างไอคอน PNG ที่ถูกต้อง (32x32 สำหรับ `outline.png`, 192x192 สำหรับ `color.png`)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชตอื่น ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การเปลี่ยนแปลงแพร่กระจาย
- **"Something went wrong" ระหว่างอัปโหลด:** อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบเนื้อหาการตอบกลับเพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" - วิธีนี้มักเลี่ยงข้อจำกัด sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอทแบบเป๊ะ
2. อัปโหลดแอปอีกครั้งและติดตั้งใหม่ในทีม/แชต
3. ตรวจสอบว่าผู้ดูแลระบบองค์กรของคุณบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม, `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## แหล่งอ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมา manifest ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความช่องด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [เอกสารอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอท Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (ช่อง/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอท

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels) - ช่องทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
