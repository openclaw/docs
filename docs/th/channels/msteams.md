---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-10T19:23:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f41c148e7ea0c2d0bde257d7af3ba0dc990f20110c08df3bb8c4d3f84e8563e0
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความและไฟล์แนบใน DM แล้ว; การส่งไฟล์ในช่อง/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats)) ระบบส่งโพลผ่าน Adaptive Cards การกระทำของข้อความแสดง `upload-file` อย่างชัดเจนสำหรับการส่งที่เริ่มจากไฟล์

## Plugin ที่บันเดิลมา

Microsoft Teams มาพร้อมเป็น Plugin ที่บันเดิลไว้ใน OpenClaw รุ่นปัจจุบัน ดังนั้นในการบิลด์แบบแพ็กเกจตามปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ที่บันเดิลไว้ ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้แพ็กเกจเปล่าเพื่อให้ตามแท็กรุ่นเผยแพร่อย่างเป็นทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

เช็กเอาต์ภายในเครื่อง (เมื่อรันจาก repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอต การสร้างแมนิเฟสต์ และการสร้างข้อมูลประจำตัวได้ในคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI ขณะนี้ยังอยู่ในสถานะพรีวิว คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรุ่นได้
</Note>

**2. เริ่มอุโมงค์** (Teams เข้าถึง localhost ไม่ได้)

ติดตั้งและยืนยันตัวตนกับ devtunnel CLI หากคุณยังไม่ได้ทำ ([คู่มือเริ่มต้นใช้งาน](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started))

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
ต้องใช้ `--allow-anonymous` เพราะ Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ คำขอบอตขาเข้าแต่ละรายการยังคงถูกตรวจสอบโดย Teams SDK โดยอัตโนมัติ
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
- สร้างและอัปโหลดแมนิเฟสต์แอป Teams (พร้อมไอคอน)
- ลงทะเบียนบอต (Teams จัดการให้ตามค่าเริ่มต้น - ไม่ต้องมีการสมัครใช้งาน Azure)

เอาต์พุตจะแสดง `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** - จดค่าเหล่านี้ไว้สำหรับขั้นตอนถัดไป และยังเสนอให้ติดตั้งแอปใน Teams โดยตรงด้วย

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

`teams app create` จะถามให้คุณติดตั้งแอป - เลือก "Install in Teams" หากคุณข้ามไป คุณสามารถรับลิงก์ภายหลังได้:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงาน**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้รันการวินิจฉัยครอบคลุมการลงทะเบียนบอต การกำหนดค่าแอป AAD ความถูกต้องของแมนิเฟสต์ และการตั้งค่า SSO

สำหรับการปรับใช้ในโปรดักชัน ให้พิจารณาใช้ [การยืนยันตัวตนแบบ federated](/th/channels/msteams#federated-authentication-certificate-plus-managed-identity) (ใบรับรองหรือ managed identity) แทน client secrets

<Note>
แชทกลุ่มถูกบล็อกตามค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (มีการกั้นด้วยการกล่าวถึง)
</Note>

## เป้าหมาย

- คุยกับ OpenClaw ผ่าน Teams DM, แชทกลุ่ม หรือช่อง
- รักษาการกำหนดเส้นทางให้กำหนดแน่นอน: คำตอบจะกลับไปยังช่องที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมช่องที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องมีการกล่าวถึง เว้นแต่จะกำหนดค่าเป็นอย่างอื่น)

## การเขียนค่า config

ตามค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดต config ที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่คงที่ หรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ เช่น `accessGroup:core-team`
- อย่าพึ่งพาการจับคู่ UPN/ชื่อที่แสดงสำหรับ allowlist - สิ่งเหล่านี้เปลี่ยนแปลงได้ OpenClaw ปิดใช้งานการจับคู่ชื่อโดยตรงตามค่าเริ่มต้น; เลือกใช้โดยชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- ตัวช่วยตั้งค่าสามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลประจำตัวอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อกเว้นแต่คุณจะเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งใดหรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ใดสามารถทริกเกอร์ในแชทกลุ่ม/ช่องได้ (fallback ไปที่ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ตามค่าเริ่มต้นยังคงมีการกั้นด้วยการกล่าวถึง)
- หากต้องการไม่อนุญาต **ช่องใดเลย** ให้ตั้งค่า `channels.msteams.groupPolicy: "disabled"`

ตัวอย่าง:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + allowlist ของช่อง**

- จำกัดขอบเขตการตอบกลับของกลุ่ม/ช่องโดยระบุรายการ teams และช่องใต้ `channels.msteams.teams`
- คีย์ควรใช้ Teams conversation ID ที่คงที่จากลิงก์ Teams ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้
- เมื่อ `groupPolicy="allowlist"` และมี allowlist ของ teams อยู่ จะยอมรับเฉพาะ teams/ช่องที่ระบุไว้เท่านั้น (มีการกั้นด้วยการกล่าวถึง)
- ตัวช่วยกำหนดค่ายอมรับรายการ `Team/Channel` และจัดเก็บให้คุณ
- เมื่อเริ่มต้น OpenClaw จะแปลงชื่อ allowlist ของ team/ช่องและผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping ลง log; ชื่อ team/ช่องที่แปลงไม่ได้จะคงไว้ตามที่พิมพ์ แต่จะถูกเพิกเฉยสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น เว้นแต่จะเปิดใช้งาน `channels.msteams.dangerouslyAllowNameMatching: true`

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

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน (บันเดิลมาในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอตและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงใน team (หรือขอบเขตส่วนบุคคลสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) และเริ่ม Gateway
6. Gateway รับทราฟฟิก Webhook ของ Bot Framework ที่ `/api/messages` ตามค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [สร้าง Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | ฟิลด์              | ค่า                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือกการสมัครใช้งาน Azure ของคุณ                           |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่                               |
   | **Pricing tier**   | **Free** สำหรับ dev/testing                                 |
   | **Type of App**    | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
การสร้างบอตแบบ multi-tenant ใหม่ถูกเลิกใช้หลังวันที่ 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่
</Warning>

3. คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลประจำตัว

1. ไปที่ทรัพยากร Azure Bot ของคุณ → **Configuration**
2. คัดลอก **Microsoft App ID** → นี่คือ `appId` ของคุณ
3. คลิก **Manage Password** → ไปที่ App Registration
4. ใต้ **Certificates & secrets** → **New client secret** → คัดลอก **Value** → นี่คือ `appPassword` ของคุณ
5. ไปที่ **Overview** → คัดลอก **Directory (tenant) ID** → นี่คือ `tenantId` ของคุณ

### ขั้นตอนที่ 3: กำหนดค่า Messaging Endpoint

1. ใน Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint** เป็น URL Webhook ของคุณ:
   - โปรดักชัน: `https://your-domain.com/api/messages`
   - การพัฒนาภายในเครื่อง: ใช้อุโมงค์ (ดู [การพัฒนาภายในเครื่อง](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้งานช่อง Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับข้อกำหนดการให้บริการ

### ขั้นตอนที่ 5: สร้างแมนิเฟสต์แอป Teams

- รวมรายการ `bot` ที่มี `botId = <App ID>`
- ขอบเขต: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล)
- เพิ่มสิทธิ์ RSC (ดู [สิทธิ์ RSC](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- Zip ไฟล์ทั้งสามเข้าด้วยกัน: `manifest.json`, `outline.png`, `color.png`

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

## การยืนยันตัวตนแบบ federated (ใบรับรองพร้อม managed identity)

> เพิ่มใน 2026.4.11

สำหรับการปรับใช้ในโปรดักชัน OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่า client secrets มีสองวิธีให้ใช้:

### ตัวเลือก A: การยืนยันตัวตนด้วยใบรับรอง

ใช้ใบรับรอง PEM ที่ลงทะเบียนกับการลงทะเบียนแอป Entra ID ของคุณ

**การตั้งค่า:**

1. สร้างหรือขอรับใบรับรอง (รูปแบบ PEM พร้อม private key)
2. ใน Entra ID → App Registration → **Certificates & secrets** → **Certificates** → อัปโหลดใบรับรองสาธารณะ

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

1. pod/VM ของบอตมี managed identity (system-assigned หรือ user-assigned)
2. **ข้อมูลประจำตัว federated identity** เชื่อม managed identity กับการลงทะเบียนแอป Entra ID
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับ token จากปลายทาง Azure IMDS (`169.254.169.254`)
4. ส่ง token ไปยัง Teams SDK สำหรับการยืนยันตัวตนบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้งาน managed identity (AKS workload identity, App Service, VM)
- สร้างข้อมูลประจำตัว federated identity บนการลงทะเบียนแอป Entra ID แล้ว
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

**การกำหนดค่า (managed identity ที่ผู้ใช้กำหนด):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (สำหรับแบบผู้ใช้กำหนดเท่านั้น)

### การตั้งค่า AKS Workload Identity

สำหรับการปรับใช้ AKS ที่ใช้ workload identity:

1. **เปิดใช้ workload identity** บนคลัสเตอร์ AKS ของคุณ
2. **สร้างข้อมูลประจำตัวแบบ federated** บนการลงทะเบียนแอป Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **ใส่คำอธิบายประกอบให้บัญชีบริการ Kubernetes** ด้วย ID ไคลเอนต์ของแอป:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **ติดป้ายกำกับให้ pod** สำหรับการฉีด workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้มีการเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) - หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธี                  | การกำหนดค่า                                    | ข้อดี                              | ข้อเสีย                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| **Client secret**    | `appPassword`                                  | ตั้งค่าได้ง่าย                    | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า |
| **ใบรับรอง**         | `authType: "federated"` + `certificatePath`    | ไม่มี secret ที่ใช้ร่วมกันผ่านเครือข่าย | มีภาระในการจัดการใบรับรอง              |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่าน, ไม่มี secret ที่ต้องจัดการ | ต้องใช้โครงสร้างพื้นฐาน Azure          |

**พฤติกรรมเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้ค่าเริ่มต้นเป็นการยืนยันตัวตนด้วย client secret การกำหนดค่าที่มีอยู่จะยังทำงานต่อไปได้โดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (การทำ tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ dev tunnel แบบถาวรเพื่อให้ URL ของคุณคงเดิมข้ามเซสชัน:

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
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ, ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ MI ที่ผู้ใช้กำหนดเท่านั้น)

## การดำเนินการข้อมูลสมาชิก

OpenClaw เปิดให้ใช้การดำเนินการ `member-info` ที่รองรับด้วย Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถระบุรายละเอียดสมาชิกช่อง (ชื่อที่แสดง, อีเมล, บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อมความยินยอมของผู้ดูแลระบบ

การดำเนินการนี้ถูกควบคุมด้วย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้เมื่อมีข้อมูลประจำตัว Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความช่อง/กลุ่มล่าสุดที่จะถูกห่อเข้าไปในพรอมป์
- ถอยกลับไปใช้ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองด้วยรายการอนุญาตผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการตั้งต้นบริบทเธรดจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่อ้างอิง (`ReplyTo*` ที่ได้มาจาก HTML ตอบกลับของ Teams) ปัจจุบันถูกส่งผ่านตามที่ได้รับ
- กล่าวอีกอย่างคือ รายการอนุญาตควบคุมว่าใครสามารถเรียกเอเจนต์ได้ วันนี้มีเพียงเส้นทางบริบทเสริมบางเส้นทางเท่านั้นที่ถูกกรอง
- ประวัติ DM สามารถจำกัดได้ด้วย `channels.msteams.dmHistoryLimit` (เทิร์นของผู้ใช้) การแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ของ Teams ปัจจุบัน (manifest)

ต่อไปนี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ใน manifest ของแอป Teams ของเรา สิทธิ์เหล่านี้ใช้ได้เฉพาะภายในทีม/แชตที่ติดตั้งแอปไว้เท่านั้น

**สำหรับช่อง (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความช่องทั้งหมดโดยไม่ต้อง @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับแชตกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความแชตกลุ่มทั้งหมดโดยไม่ต้อง @mention

เมื่อต้องการเพิ่มสิทธิ์ RSC ผ่าน Teams CLI:

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
- `authorization.permissions.resourceSpecific` ต้องรวมการอ่าน/ส่งของช่อง หากคุณต้องการทราฟฟิกของช่อง

### การอัปเดตแอปที่มีอยู่

เมื่อต้องการอัปเดตแอป Teams ที่ติดตั้งแล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

หลังจากอัปเดต ให้ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล และ **ออกจาก Teams อย่างสมบูรณ์แล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างเมทาดาทาแอปที่แคชไว้

<details>
<summary>การอัปเดต manifest ด้วยตนเอง (โดยไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัด manifest ใหม่** พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลดไฟล์ zip ใหม่:
   - **Teams Admin Center:** แอป Teams → จัดการแอป → ค้นหาแอปของคุณ → อัปโหลดเวอร์ชันใหม่
   - **Sideload:** ใน Teams → แอป → จัดการแอปของคุณ → อัปโหลดแอปแบบกำหนดเอง

</details>

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อใช้ **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว, ไม่มีสิทธิ์ Graph API)

ทำงานได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความช่อง
- ส่งเนื้อหา **ข้อความ** ของข้อความช่อง
- รับไฟล์แนบใน **ส่วนบุคคล (DM)**

ทำงานไม่ได้:

- **เนื้อหารูปภาพหรือไฟล์** ของช่อง/กลุ่ม (payload มีเพียง HTML stub)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจากเหตุการณ์ webhook สด)

### เมื่อใช้ **Teams RSC + สิทธิ์ Microsoft Graph Application**

เพิ่มความสามารถ:

- ดาวน์โหลดเนื้อหาที่โฮสต์ไว้ (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความของช่อง/แชตผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ            | สิทธิ์ RSC            | Graph API                            |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์** | ใช่ (ผ่าน webhook)   | ไม่ใช่ (ทำได้เฉพาะ polling)        |
| **ข้อความย้อนหลัง**     | ไม่ใช่               | ใช่ (สามารถค้นหาประวัติได้)        |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ manifest ของแอป | ต้องใช้ความยินยอมของผู้ดูแลระบบ + token flow |
| **ทำงานแบบออฟไลน์**    | ไม่ใช่ (ต้องกำลังทำงานอยู่) | ใช่ (ค้นหาได้ทุกเวลา)              |

**สรุป:** RSC ใช้สำหรับการฟังแบบเรียลไทม์ ส่วน Graph API ใช้สำหรับการเข้าถึงย้อนหลัง หากต้องการตามเก็บข้อความที่พลาดไประหว่างออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องใช้ความยินยอมของผู้ดูแลระบบ)

## สื่อและประวัติที่เปิดใช้ Graph (จำเป็นสำหรับช่อง)

หากคุณต้องการรูปภาพ/ไฟล์ใน **ช่อง** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ความยินยอมของผู้ดูแลระบบ

1. ใน **การลงทะเบียนแอป** ของ Entra ID (Azure AD) ให้เพิ่มสิทธิ์ **Application** ของ Microsoft Graph:
   - `ChannelMessage.Read.All` (ไฟล์แนบช่อง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชตกลุ่ม)
2. **ให้ความยินยอมของผู้ดูแลระบบ** สำหรับ tenant
3. เพิ่มเวอร์ชัน **manifest** ของแอป Teams, อัปโหลดใหม่ และ **ติดตั้งแอปใน Teams ใหม่**
4. **ออกจาก Teams อย่างสมบูรณ์แล้วเปิดใหม่** เพื่อล้างเมทาดาทาแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการ mention ผู้ใช้:** การ @mention ผู้ใช้จะทำงานได้ทันทีสำหรับผู้ใช้ในการสนทนา อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้ที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** แบบไดนามิก ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมของผู้ดูแลระบบ

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน HTTP webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับจาก LLM ที่ช้า) คุณอาจเห็น:

- Gateway หมดเวลา
- Teams ส่งข้อความซ้ำ (ทำให้เกิดรายการซ้ำ)
- การตอบกลับถูกทิ้ง

OpenClaw จัดการเรื่องนี้โดยส่งคืนอย่างรวดเร็วและส่งการตอบกลับเชิงรุก แต่การตอบสนองที่ช้ามากยังอาจก่อให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดใช้งานช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลรับรองของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: allowlist สำหรับ DM (แนะนำให้ใช้ AAD object IDs) วิซาร์ดจะแปลงชื่อเป็น ID ระหว่างการตั้งค่าเมื่อมีสิทธิ์เข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้งานการจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางชื่อทีม/ช่องทางโดยตรงอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดชิ้นส่วนข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.msteams.mediaAllowHosts`: allowlist สำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: allowlist สำหรับแนบ Authorization headers เมื่อ retry สื่อ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: บังคับให้ @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การแทนที่รายทีม
- `channels.msteams.teams.<teamId>.requireMention`: การแทนที่รายทีม
- `channels.msteams.teams.<teamId>.tools`: การแทนที่นโยบายเครื่องมือค่าเริ่มต้นรายทีม (`allow`/`deny`/`alsoAllow`) ที่ใช้เมื่อไม่มีการแทนที่ระดับช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: การแทนที่นโยบายเครื่องมือค่าเริ่มต้นรายทีมรายผู้ส่ง (รองรับ wildcard `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การแทนที่นโยบายเครื่องมือรายช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การแทนที่นโยบายเครื่องมือรายช่องทางรายผู้ส่ง (รองรับ wildcard `"*"`)
- คีย์ `toolsBySender` ควรใช้ prefix ที่ชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (คีย์เดิมที่ไม่มี prefix ยัง map ไปที่ `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิด action ข้อมูลสมาชิกที่ใช้ Graph เป็นแบ็กเอนด์ (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลรับรอง Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน - `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (federated + certificate auth)
- `channels.msteams.certificateThumbprint`: thumbprint ของใบรับรอง (ไม่บังคับ, ไม่จำเป็นสำหรับ auth)
- `channels.msteams.useManagedIdentity`: เปิดใช้งาน auth แบบ managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ managed identity ที่ผู้ใช้กำหนด
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชทกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบ agent มาตรฐาน (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความส่วนตัวใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดเทียบกับโพสต์

Teams เพิ่งเพิ่มรูปแบบ UI ช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                    | คำอธิบาย                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (คลาสสิก)      | ข้อความแสดงเป็นการ์ดพร้อมการตอบกลับแบบเธรดด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **Threads** (คล้าย Slack) | ข้อความไหลต่อกันแบบเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องทางใช้รูปแบบ UI ใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางรูปแบบ Threads → การตอบกลับจะดูซ้อนกันอย่างไม่เป็นธรรมชาติ
- `top-level` ในช่องทางรูปแบบ Posts → การตอบกลับจะปรากฏเป็นโพสต์ระดับบนสุดแยกต่างหากแทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนดค่า `replyStyle` รายช่องทางตามวิธีที่ตั้งค่าช่องทางนั้น:

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

เมื่อบอตส่งการตอบกลับเข้าไปในช่องทาง `replyStyle` จะถูกแก้ค่าจากการแทนที่ที่เฉพาะเจาะจงที่สุดลงไปจนถึงค่าเริ่มต้น ค่าแรกที่ไม่ใช่ `undefined` จะชนะ:

1. **รายช่องทาง** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **รายทีม** — `channels.msteams.teams.<teamId>.replyStyle`
3. **ทั่วระบบ** — `channels.msteams.replyStyle`
4. **ค่าเริ่มต้นโดยนัย** — อนุมานจาก `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

หากคุณตั้งค่า `requireMention: false` แบบทั่วระบบโดยไม่มี `replyStyle` ที่ชัดเจน mention ในช่องทางรูปแบบ Posts จะแสดงเป็นโพสต์ระดับบนสุด แม้เมื่อขาเข้าเป็นการตอบกลับในเธรด ให้ปักค่า `replyStyle: "thread"` ที่ระดับทั่วระบบ ทีม หรือช่องทางเพื่อหลีกเลี่ยงความคาดไม่ถึง

### การรักษาบริบทเธรด

เมื่อ `replyStyle: "thread"` มีผล และบอตถูก @mention จากภายในเธรดช่องทาง OpenClaw จะผูก root ของเธรดเดิมกลับเข้ากับ conversation reference ขาออก (`19:…@thread.tacv2;messageid=<root>`) เพื่อให้การตอบกลับลงในเธรดเดียวกัน สิ่งนี้ใช้ได้ทั้งกับการส่งแบบสด (ใน turn) และการส่งเชิงรุกที่เกิดขึ้นหลังจาก turn context ของ Bot Framework หมดอายุแล้ว (เช่น agent ที่ทำงานยาวนาน, การตอบกลับ tool-call ที่เข้าคิวผ่าน `mcp__openclaw__message`)

root ของเธรดถูกนำมาจาก `threadId` ที่จัดเก็บไว้บน conversation reference การอ้างอิงเก่าที่จัดเก็บไว้ก่อนมี `threadId` จะ fallback ไปที่ `activityId` (กิจกรรมขาเข้าใดก็ตามที่ seed การสนทนาครั้งล่าสุด) ดังนั้น deployment ที่มีอยู่จึงยังทำงานต่อได้โดยไม่ต้อง seed ใหม่

เมื่อ `replyStyle: "top-level"` มีผล ข้อความขาเข้าจากเธรดของช่องทางจะถูกตอบเป็นโพสต์ระดับบนสุดใหม่โดยเจตนา — ไม่มีการแนบ suffix ของเธรด นี่คือพฤติกรรมที่ถูกต้องสำหรับช่องทางรูปแบบ Threads; หากคุณเห็นโพสต์ระดับบนสุดในที่ที่คาดว่าจะเป็นการตอบกลับแบบเธรด แปลว่า `replyStyle` ของคุณตั้งค่าไม่ถูกต้องสำหรับช่องทางนั้น

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DMs:** รูปภาพและไฟล์แนบทำงานผ่าน Teams bot file APIs
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในที่เก็บ M365 (SharePoint/OneDrive) payload ของ Webhook มีเฉพาะ HTML stub ไม่ใช่ไบต์ไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งแบบเน้นไฟล์อย่างชัดเจน ให้ใช้ `action=upload-file` พร้อม `media` / `filePath` / `path`; `message` ที่ไม่บังคับจะกลายเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` จะแทนที่ชื่อที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความช่องทางที่มีรูปภาพจะถูกรับเป็นข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
ตามค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น แทนที่ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
Authorization headers จะถูกแนบเฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework) ควรรักษารายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบหลาย tenant)

## การส่งไฟล์ในแชทกลุ่ม

บอตสามารถส่งไฟล์ใน DM โดยใช้ flow FileConsentCard (มีในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชทกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่ต้องมี                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **แชทกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องมี `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | inline ที่เข้ารหัส Base64                        | ใช้งานได้ทันที                            |

### เหตุผลที่แชทกลุ่มต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (Graph API endpoint `/me/drive` ใช้ไม่ได้กับ application identities) ในการส่งไฟล์ในแชทกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ, เปิดใช้งานลิงก์แชร์รายผู้ใช้

2. **ให้ความยินยอมจากผู้ดูแลระบบ** สำหรับ tenant

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกแชทเข้าถึงได้)      |

การแชร์รายผู้ใช้ปลอดภัยกว่าเพราะมีเฉพาะผู้เข้าร่วมแชทเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback เป็นการแชร์ทั่วทั้งองค์กร

### พฤติกรรม fallback

| สถานการณ์                                          | ผลลัพธ์                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| แชทกลุ่ม + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์            |
| แชทกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว), ส่งเฉพาะข้อความ |
| แชทส่วนตัว + ไฟล์                              | flow FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint)    |
| ทุกบริบท + รูปภาพ                               | inline ที่เข้ารหัส Base64 (ทำงานได้โดยไม่ต้องใช้ SharePoint)   |

### ตำแหน่งจัดเก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกเก็บไว้ในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพล Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบ native)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- ระบบจะบันทึกคะแนนโหวตโดย gateway ใน `~/.openclaw/msteams-polls.json`
- gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- Poll ยังไม่โพสต์สรุปผลอัตโนมัติในตอนนี้ (ตรวจดูไฟล์ที่เก็บข้อมูลได้หากจำเป็น)

## การ์ดการนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนา Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอแบบทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` แล้ว ข้อความของ message จะเป็นค่าไม่บังคับ

**เครื่องมือ Agent:**

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

สำหรับรายละเอียดรูปแบบ target โปรดดู [รูปแบบ target](#target-formats) ด้านล่าง

## รูปแบบ target

target ของ MSTeams ใช้ prefix เพื่อแยกระหว่างผู้ใช้และการสนทนา:

| ประเภท target        | รูปแบบ                           | ตัวอย่าง                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)    | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)              |
| กลุ่ม/channel       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/channel (ดิบ) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`) |

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

**ตัวอย่างเครื่องมือ Agent:**

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
หากไม่มี prefix `user:` ชื่อจะใช้การ resolve เป็นกลุ่มหรือทีมตามค่าเริ่มต้น ใช้ `user:` เสมอเมื่อกำหนดเป้าหมายเป็นบุคคลด้วย display name
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกทำได้ก็ต่อเมื่อผู้ใช้เคยโต้ตอบแล้วเท่านั้น เพราะเราจะเก็บ reference ของการสนทนา ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมด้วย allowlist

## ID ของทีมและ Channel (ข้อควรระวังที่พบบ่อย)

พารามิเตอร์ query `groupId` ใน URL ของ Teams **ไม่ใช่** team ID ที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จาก path ของ URL แทน:

**URL ของทีม:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL ของ Channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**สำหรับ config:**

- คีย์ทีม = path segment หลัง `/team/` (URL-decoded เช่น `19:Bk4j...@thread.tacv2`; tenant รุ่นเก่าอาจแสดง `@thread.skype` ซึ่งใช้ได้เช่นกัน)
- คีย์ Channel = path segment หลัง `/channel/` (URL-decoded)
- **ไม่ต้องสนใจ** พารามิเตอร์ query `groupId` สำหรับการ routing ของ OpenClaw นี่คือ Microsoft Entra group ID ไม่ใช่ Bot Framework conversation ID ที่ใช้ใน activity ของ Teams ขาเข้า

## Channel ส่วนตัว

Bot รองรับ channel ส่วนตัวได้จำกัด:

| ฟีเจอร์                      | Channel มาตรฐาน | Channel ส่วนตัว       |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้ง Bot               | ใช่               | จำกัด                  |
| ข้อความแบบเรียลไทม์ (webhook) | ใช่               | อาจไม่ทำงาน           |
| สิทธิ์ RSC                   | ใช่               | อาจมีพฤติกรรมต่างออกไป |
| @mentions                    | ใช่               | หาก bot เข้าถึงได้     |
| ประวัติ Graph API            | ใช่               | ใช่ (พร้อมสิทธิ์)      |

**วิธีเลี่ยงปัญหาหาก channel ส่วนตัวไม่ทำงาน:**

1. ใช้ channel มาตรฐานสำหรับการโต้ตอบกับ bot
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความหา bot โดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงประวัติ (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาทั่วไป

- **รูปภาพไม่แสดงใน channel:** ขาดสิทธิ์ Graph หรือ admin consent ติดตั้งแอป Teams ใหม่ แล้วปิด Teams ให้สนิทและเปิดใหม่
- **ไม่มีการตอบกลับใน channel:** โดยค่าเริ่มต้นต้องมีการ mention; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่ารายทีม/channel
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบและเพิ่มแอปใหม่ แล้วปิด Teams ให้สนิทเพื่อ refresh
- **401 Unauthorized จาก webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT หมายความว่า endpoint เข้าถึงได้แต่การ auth ล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ icon ที่มีขนาด 0 bytes สร้าง icon PNG ที่ถูกต้อง (32x32 สำหรับ `outline.png`, 192x192 สำหรับ `color.png`)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชทอื่น ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การ propagate เสร็จ
- **"Something went wrong" ขณะอัปโหลด:** อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด browser DevTools (F12) → แท็บ Network แล้วตรวจดู response body เพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" วิธีนี้มักเลี่ยงข้อจำกัด sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของ bot ทุกตัวอักษร
2. อัปโหลดแอปใหม่และติดตั้งใหม่ในทีม/แชท
3. ตรวจสอบว่า admin ขององค์กรบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม, `ChatMessage.Read.Chat` สำหรับ group chat

## อ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความ channel ด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [ข้อมูลอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของ Teams bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/group ต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการ bot

## ที่เกี่ยวข้อง

- [ภาพรวม Channel](/th/channels) - channel ที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และ flow การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรม group chat และการควบคุมด้วย mention
- [Channel Routing](/th/channels/channel-routing) - การ routing session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
