---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-11T20:21:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7bf8cd0ae6c6053f51794e6bc03bb6d927d640256272f3afb04f3b0ec99eb43
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความ + ไฟล์แนบ DM แล้ว; การส่งไฟล์ในช่องทาง/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats)) Poll จะถูกส่งผ่าน Adaptive Cards การดำเนินการกับข้อความเปิดเผย `upload-file` อย่างชัดเจนสำหรับการส่งที่เน้นไฟล์ก่อน

## Plugin ที่มาพร้อมชุด

Microsoft Teams จัดส่งเป็น Plugin ที่มาพร้อมชุดใน OpenClaw รุ่นปัจจุบัน ดังนั้นจึงไม่จำเป็นต้องติดตั้งแยกต่างหากในบิลด์แพ็กเกจปกติ

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ที่มาพร้อมชุด ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้แพ็กเกจเปล่าเพื่อติดตามแท็กรุ่นทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

เช็กเอาต์ในเครื่อง (เมื่อรันจากรีโป git):

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
Teams CLI ขณะนี้ยังอยู่ในสถานะ preview คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรุ่นได้
</Note>

**2. เริ่ม tunnel** (Teams เข้าถึง localhost ไม่ได้)

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
ต้องใช้ `--allow-anonymous` เพราะ Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ คำขอบอทขาเข้าทุกรายการยังคงถูกตรวจสอบโดย Teams SDK โดยอัตโนมัติ
</Note>

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (แต่อาจเปลี่ยน URL ในแต่ละเซสชัน)

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
- ลงทะเบียนบอท (ค่าเริ่มต้นคือ Teams-managed - ไม่ต้องมี Azure subscription)

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

`teams app create` จะถามให้คุณติดตั้งแอป - เลือก "ติดตั้งใน Teams" หากคุณข้ามไป คุณสามารถรับลิงก์ภายหลังได้:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงานได้**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้รันการวินิจฉัยครอบคลุมการลงทะเบียนบอท การกำหนดค่าแอป AAD ความถูกต้องของ manifest และการตั้งค่า SSO

สำหรับการปรับใช้ใน production ให้พิจารณาใช้ [การยืนยันตัวตนแบบ federated](/th/channels/msteams#federated-authentication-certificate-plus-managed-identity) (ใบรับรองหรือ managed identity) แทน client secret

<Note>
แชทกลุ่มถูกบล็อกตามค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (มีการกั้นด้วยการกล่าวถึง)
</Note>

## เป้าหมาย

- คุยกับ OpenClaw ผ่าน DM, แชทกลุ่ม หรือช่องทางของ Teams
- รักษาการกำหนดเส้นทางให้กำหนดได้แน่นอน: การตอบกลับจะกลับไปยังช่องทางที่เข้ามาเสมอ
- ใช้พฤติกรรมช่องทางที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องกล่าวถึง เว้นแต่กำหนดค่าเป็นอย่างอื่น)

## การเขียนค่า config

ตามค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดต config ที่เรียกโดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกละเว้นจนกว่าจะได้รับอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่เสถียรหรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ เช่น `accessGroup:core-team`
- อย่าพึ่งพาการจับคู่ UPN/display-name สำหรับ allowlist - ค่าเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงตามค่าเริ่มต้น; เลือกเปิดใช้อย่างชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- ตัวช่วยสร้างสามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph เมื่อข้อมูลประจำตัวอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อก เว้นแต่คุณเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งหรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ใดสามารถทริกเกอร์ในแชทกลุ่ม/ช่องทางได้ (fallback ไปที่ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ยังคงกั้นด้วยการกล่าวถึงตามค่าเริ่มต้น)
- หากต้องการไม่อนุญาต **ช่องทางใดเลย** ให้ตั้งค่า `channels.msteams.groupPolicy: "disabled"`

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

**Teams + channel allowlist**

- จำกัดขอบเขตการตอบกลับของกลุ่ม/ช่องทางด้วยการระบุทีมและช่องทางภายใต้ `channels.msteams.teams`
- คีย์ควรใช้ Teams conversation ID ที่เสถียรจากลิงก์ Teams ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้
- เมื่อ `groupPolicy="allowlist"` และมี teams allowlist อยู่ จะยอมรับเฉพาะทีม/ช่องทางที่ระบุไว้เท่านั้น (มีการกั้นด้วยการกล่าวถึง)
- ตัวช่วยกำหนดค่ารับรายการ `Team/Channel` และจัดเก็บให้คุณ
- เมื่อเริ่มต้น OpenClaw จะแปลงชื่อทีม/ช่องทางและชื่อ allowlist ผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึกการแมปลง log; ชื่อทีม/ช่องทางที่แปลงไม่ได้จะคงไว้ตามที่พิมพ์ แต่ตามค่าเริ่มต้นจะถูกละเว้นสำหรับการกำหนดเส้นทาง เว้นแต่เปิดใช้งาน `channels.msteams.dangerouslyAllowNameMatching: true`

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

หากคุณใช้ Teams CLI ไม่ได้ คุณสามารถตั้งค่าบอทด้วยตนเองผ่าน Azure Portal

### วิธีการทำงาน

1. ตรวจสอบว่า Microsoft Teams Plugin พร้อมใช้งาน (มาพร้อมชุดในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอทและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงในทีม (หรือขอบเขตส่วนบุคคลสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปร env) แล้วเริ่ม Gateway
6. Gateway จะฟังทราฟฟิก Webhook ของ Bot Framework บน `/api/messages` ตามค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [สร้าง Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **พื้นฐาน**:

   | ฟิลด์              | ค่า                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอทของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือก Azure subscription ของคุณ                           |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่                               |
   | **Pricing tier**   | **Free** สำหรับ dev/testing                                 |
   | **Type of App**    | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
การสร้างบอท multi-tenant ใหม่ถูกเลิกใช้หลัง 2025-07-31 ใช้ **Single Tenant** สำหรับบอทใหม่
</Warning>

3. คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลประจำตัว

1. ไปที่ทรัพยากร Azure Bot ของคุณ → **Configuration**
2. คัดลอก **Microsoft App ID** → นี่คือ `appId` ของคุณ
3. คลิก **Manage Password** → ไปที่ App Registration
4. ภายใต้ **Certificates & secrets** → **New client secret** → คัดลอก **Value** → นี่คือ `appPassword` ของคุณ
5. ไปที่ **Overview** → คัดลอก **Directory (tenant) ID** → นี่คือ `tenantId` ของคุณ

### ขั้นตอนที่ 3: กำหนดค่า Messaging Endpoint

1. ใน Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint** เป็น URL Webhook ของคุณ:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: ใช้ tunnel (ดู [การพัฒนาในเครื่อง](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้งานช่องทาง Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

### ขั้นตอนที่ 5: สร้าง Teams App Manifest

- รวมรายการ `bot` พร้อม `botId = <App ID>`
- ขอบเขต: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล)
- เพิ่มสิทธิ์ RSC (ดู [สิทธิ์ RSC](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- Zip ทั้งสามไฟล์เข้าด้วยกัน: `manifest.json`, `outline.png`, `color.png`

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

ช่องทาง Teams จะเริ่มโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและมี config `msteams` พร้อมข้อมูลประจำตัว

</details>

## การยืนยันตัวตนแบบ federated (ใบรับรองพร้อม managed identity)

> เพิ่มใน 2026.4.11

สำหรับการปรับใช้ใน production OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่า client secret มีสองวิธีให้ใช้:

### ตัวเลือก A: การยืนยันตัวตนโดยใช้ใบรับรอง

ใช้ใบรับรอง PEM ที่ลงทะเบียนกับ Entra ID app registration ของคุณ

**การตั้งค่า:**

1. สร้างหรือรับใบรับรอง (รูปแบบ PEM พร้อม private key)
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

**ตัวแปร env:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### ตัวเลือก B: Azure Managed Identity

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน เหมาะอย่างยิ่งสำหรับการปรับใช้บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity พร้อมใช้งาน

**วิธีการทำงาน:**

1. pod/VM ของบอทมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity กับ Entra ID app registration
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับ token จาก Azure IMDS endpoint (`169.254.169.254`)
4. token ถูกส่งต่อให้ Teams SDK สำหรับการยืนยันตัวตนของบอท

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- federated identity credential ที่สร้างบน Entra ID app registration
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

**การกำหนดค่า (ข้อมูลประจำตัวที่มีการจัดการที่ผู้ใช้กำหนด):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะแบบที่ผู้ใช้กำหนด)

### การตั้งค่า AKS Workload Identity

สำหรับการปรับใช้ AKS ที่ใช้ workload identity:

1. **เปิดใช้งาน workload identity** บนคลัสเตอร์ AKS ของคุณ
2. **สร้างข้อมูลประจำตัวแบบสหพันธรัฐ** บนการลงทะเบียนแอป Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **ใส่คำอธิบายประกอบให้บัญชีบริการ Kubernetes** ด้วยรหัสไคลเอนต์ของแอป:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **ติดป้ายกำกับให้พ็อด** สำหรับการฉีด workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้แน่ใจว่ามีการเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) - หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธี | การกำหนดค่า | ข้อดี | ข้อเสีย |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret** | `appPassword` | ตั้งค่าง่าย | ต้องหมุนเวียนความลับ ปลอดภัยน้อยกว่า |
| **ใบรับรอง** | `authType: "federated"` + `certificatePath` | ไม่มีความลับร่วมส่งผ่านเครือข่าย | มีภาระในการจัดการใบรับรอง |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ต้องใช้รหัสผ่าน ไม่มีความลับให้จัดการ | ต้องใช้โครงสร้างพื้นฐาน Azure |

**พฤติกรรมเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนด้วย client secret เป็นค่าเริ่มต้น การกำหนดค่าที่มีอยู่ยังคงทำงานได้โดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (การทำ tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ dev tunnel แบบคงอยู่เพื่อให้ URL ของคุณคงเดิมในแต่ละเซสชัน:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละเซสชัน)

หาก URL tunnel ของคุณเปลี่ยน ให้อัปเดตปลายทาง:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## การทดสอบบอต

**เรียกใช้การวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียนบอต แอป AAD ไฟล์ manifest และการกำหนดค่า SSO ในรอบเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ใช้ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหาบอตใน Teams และส่ง DM
3. ตรวจสอบบันทึก Gateway สำหรับกิจกรรมขาเข้า

## ตัวแปรสภาพแวดล้อม

คีย์การกำหนดค่าทั้งหมดสามารถตั้งค่าผ่านตัวแปรสภาพแวดล้อมแทนได้:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ MI ที่ผู้ใช้กำหนด)

## การดำเนินการข้อมูลสมาชิก

OpenClaw เปิดเผยการดำเนินการ `member-info` ที่ใช้ Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถระบุรายละเอียดสมาชิกของช่อง (ชื่อที่แสดง อีเมล บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อมความยินยอมของผู้ดูแลระบบ

การดำเนินการนี้ถูกควบคุมด้วย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลประจำตัว Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความช่อง/กลุ่มล่าสุดที่จะถูกห่อเข้าไปในพรอมต์
- ย้อนกลับไปใช้ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองด้วยรายการอนุญาตผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการเติมบริบทเธรดเริ่มต้นจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่อ้างอิง (`ReplyTo*` ที่ได้มาจาก HTML การตอบกลับของ Teams) ปัจจุบันจะถูกส่งต่อไปตามที่ได้รับ
- กล่าวอีกอย่างคือ รายการอนุญาตควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ปัจจุบันมีเพียงเส้นทางบริบทเสริมบางรายการเท่านั้นที่ถูกกรอง
- ประวัติ DM สามารถจำกัดได้ด้วย `channels.msteams.dmHistoryLimit` (รอบของผู้ใช้) การ override รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ของ Teams ปัจจุบัน (manifest)

ต่อไปนี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ใน manifest แอป Teams ของเรา สิทธิ์เหล่านี้ใช้เฉพาะภายในทีม/แชทที่ติดตั้งแอปเท่านั้น

**สำหรับช่อง (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความช่องทั้งหมดโดยไม่ต้อง @mention
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

ตัวอย่างที่น้อยที่สุดและถูกต้องพร้อมฟิลด์ที่จำเป็น แทนที่ ID และ URL

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
- `authorization.permissions.resourceSpecific` ต้องรวมสิทธิ์อ่าน/ส่งของช่องหากคุณต้องการทราฟฟิกช่อง

### การอัปเดตแอปที่มีอยู่

หากต้องการอัปเดตแอป Teams ที่ติดตั้งอยู่แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

หลังจากอัปเดตแล้ว ให้ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล และ **ออกจาก Teams ทั้งหมดแล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างเมทาดาทาแอปที่แคชไว้

<details>
<summary>การอัปเดต manifest ด้วยตนเอง (ไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัด manifest ใหม่** พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **Teams Admin Center:** แอป Teams → จัดการแอป → ค้นหาแอปของคุณ → อัปโหลดเวอร์ชันใหม่
   - **Sideload:** ใน Teams → แอป → จัดการแอปของคุณ → อัปโหลดแอปแบบกำหนดเอง

</details>

## ความสามารถ: RSC เท่านั้น เทียบกับ Graph

### ด้วย **Teams RSC เท่านั้น** (ติดตั้งแอปแล้ว ไม่มีสิทธิ์ Graph API)

ทำงานได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความช่อง
- ส่งเนื้อหา **ข้อความ** ของข้อความช่อง
- รับไฟล์แนบใน **ส่วนบุคคล (DM)**

ไม่ทำงาน:

- **เนื้อหารูปภาพหรือไฟล์** ของช่อง/กลุ่ม (เพย์โหลดมีเพียง HTML stub)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจากเหตุการณ์ webhook สด)

### ด้วย **Teams RSC + สิทธิ์ Microsoft Graph Application**

เพิ่ม:

- ดาวน์โหลดเนื้อหาที่โฮสต์ไว้ (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความช่อง/แชทผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ | สิทธิ์ RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์** | ใช่ (ผ่าน webhook) | ไม่ (เฉพาะการ polling) |
| **ข้อความในอดีต** | ไม่ | ใช่ (สามารถ query ประวัติได้) |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ manifest แอป | ต้องใช้ความยินยอมของผู้ดูแลระบบ + โฟลว์โทเค็น |
| **ทำงานแบบออฟไลน์** | ไม่ (ต้องรันอยู่) | ใช่ (query ได้ทุกเวลา) |

**สรุป:** RSC ใช้สำหรับการฟังแบบเรียลไทม์ ส่วน Graph API ใช้สำหรับการเข้าถึงข้อมูลย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไปขณะออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องได้รับความยินยอมจากผู้ดูแลระบบ)

## สื่อและประวัติที่เปิดใช้งาน Graph (จำเป็นสำหรับช่อง)

หากคุณต้องการรูปภาพ/ไฟล์ใน **ช่อง** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้งานสิทธิ์ Microsoft Graph และให้ความยินยอมของผู้ดูแลระบบ

1. ใน Entra ID (Azure AD) **App Registration** ให้เพิ่ม **สิทธิ์ Application** ของ Microsoft Graph:
   - `ChannelMessage.Read.All` (ไฟล์แนบของช่อง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชทกลุ่ม)
2. **ให้ความยินยอมของผู้ดูแลระบบ** สำหรับ tenant
3. เพิ่มค่า **เวอร์ชัน manifest** ของแอป Teams อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ออกจาก Teams ทั้งหมดแล้วเปิดใหม่** เพื่อล้างเมทาดาทาแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการ mention ผู้ใช้:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ในการสนทนา อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้ที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** แบบไดนามิก ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมของผู้ดูแลระบบ

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน HTTP webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับของ LLM ที่ช้า) คุณอาจเห็น:

- Gateway หมดเวลา
- Teams ลองส่งข้อความซ้ำ (ทำให้เกิดข้อความซ้ำ)
- การตอบกลับถูกทิ้ง

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งคำตอบเชิงรุก แต่คำตอบที่ช้ามากยังอาจทำให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลรับรองของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: รายการอนุญาตสำหรับ DM (แนะนำให้ใช้ AAD object IDs) วิซาร์ดจะแปลงชื่อเป็น IDs ระหว่างการตั้งค่าเมื่อมีสิทธิ์เข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้งานการจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางโดยใช้ชื่อทีม/ช่องทางโดยตรงอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดชิ้นข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งชิ้นตามความยาว
- `channels.msteams.mediaAllowHosts`: รายการอนุญาตสำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมนของ Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: รายการอนุญาตสำหรับแนบส่วนหัว Authorization เมื่อลองสื่อซ้ำ (ค่าเริ่มต้นเป็นโฮสต์ของ Graph + Bot Framework)
- `channels.msteams.requireMention`: ต้องมี @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [สไตล์การตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การแทนที่ต่อทีม
- `channels.msteams.teams.<teamId>.requireMention`: การแทนที่ต่อทีม
- `channels.msteams.teams.<teamId>.tools`: การแทนที่นโยบายเครื่องมือเริ่มต้นต่อทีม (`allow`/`deny`/`alsoAllow`) ที่ใช้เมื่อไม่มีการแทนที่ระดับช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: การแทนที่นโยบายเครื่องมือต่อทีมต่อผู้ส่งโดยค่าเริ่มต้น (รองรับไวลด์การ์ด `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การแทนที่ต่อช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การแทนที่ต่อช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การแทนที่นโยบายเครื่องมือต่อช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การแทนที่นโยบายเครื่องมือต่อช่องทางต่อผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปไปที่ `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดแอ็กชันข้อมูลสมาชิกที่รองรับด้วย Graph (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลรับรอง Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน - `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (federated + certificate auth)
- `channels.msteams.certificateThumbprint`: ลายนิ้วมือใบรับรอง (ไม่บังคับ, ไม่จำเป็นสำหรับ auth)
- `channels.msteams.useManagedIdentity`: เปิดใช้งาน auth แบบ managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ managed identity ที่ผู้ใช้กำหนด
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชตกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบเอเจนต์มาตรฐาน (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความโดยตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## สไตล์การตอบกลับ: เธรดเทียบกับโพสต์

Teams เพิ่งเพิ่มสไตล์ UI ของช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| สไตล์                    | คำอธิบาย                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **โพสต์** (แบบคลาสสิก)      | ข้อความปรากฏเป็นการ์ดพร้อมคำตอบแบบเธรดอยู่ด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **เธรด** (คล้าย Slack) | ข้อความไหลต่อกันเป็นเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องทางใช้สไตล์ UI แบบใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางสไตล์ Threads → คำตอบจะปรากฏซ้อนกันอย่างไม่เหมาะสม
- `top-level` ในช่องทางสไตล์ Posts → คำตอบจะปรากฏเป็นโพสต์ระดับบนแยกต่างหากแทนที่จะอยู่ในเธรด

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

### ลำดับความสำคัญในการแก้ค่า

เมื่อบอตส่งคำตอบเข้าไปในช่องทาง ระบบจะแก้ค่า `replyStyle` จากการแทนที่ที่เฉพาะเจาะจงที่สุดลงไปถึงค่าเริ่มต้น ค่าแรกที่ไม่ใช่ `undefined` จะชนะ:

1. **ต่อช่องทาง** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **ต่อทีม** — `channels.msteams.teams.<teamId>.replyStyle`
3. **ส่วนกลาง** — `channels.msteams.replyStyle`
4. **ค่าเริ่มต้นโดยนัย** — ได้มาจาก `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

หากคุณตั้ง `requireMention: false` แบบส่วนกลางโดยไม่มี `replyStyle` ที่ชัดเจน การกล่าวถึงในช่องทางสไตล์ Posts จะปรากฏเป็นโพสต์ระดับบน แม้ขาเข้าจะเป็นคำตอบในเธรดก็ตาม ปัก `replyStyle: "thread"` ไว้ที่ระดับส่วนกลาง ทีม หรือช่องทางเพื่อหลีกเลี่ยงผลลัพธ์ที่ไม่คาดคิด

### การรักษาบริบทของเธรด

เมื่อ `replyStyle: "thread"` มีผล และบอตถูก @mention จากภายในเธรดของช่องทาง OpenClaw จะแนบรากเธรดเดิมกลับเข้ากับการอ้างอิงบทสนทนาขาออก (`19:…@thread.tacv2;messageid=<root>`) เพื่อให้คำตอบไปอยู่ในเธรดเดียวกัน สิ่งนี้ใช้ได้ทั้งกับการส่งแบบสด (ภายในเทิร์น) และการส่งเชิงรุกที่เกิดขึ้นหลังจากบริบทเทิร์นของ Bot Framework หมดอายุแล้ว (เช่น เอเจนต์ที่รันนาน, คำตอบการเรียกเครื่องมือที่เข้าคิวผ่าน `mcp__openclaw__message`)

รากเธรดมาจาก `threadId` ที่จัดเก็บไว้ในการอ้างอิงบทสนทนา การอ้างอิงที่จัดเก็บไว้เก่ากว่าซึ่งมีมาก่อน `threadId` จะย้อนกลับไปใช้ `activityId` (กิจกรรมขาเข้าที่เพาะบทสนทนาครั้งล่าสุด) ดังนั้นการปรับใช้ที่มีอยู่จึงยังทำงานได้โดยไม่ต้องเพาะใหม่

เมื่อ `replyStyle: "top-level"` มีผล ขาเข้าจากเธรดช่องทางจะถูกตอบเป็นโพสต์ระดับบนใหม่โดยตั้งใจ โดยไม่แนบส่วนต่อท้ายเธรด นี่คือพฤติกรรมที่ถูกต้องสำหรับช่องทางสไตล์ Threads หากคุณเห็นโพสต์ระดับบนในที่ที่คาดว่าจะเป็นคำตอบแบบเธรด แสดงว่า `replyStyle` ของคุณตั้งค่าไม่ถูกต้องสำหรับช่องทางนั้น

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DM:** รูปภาพและไฟล์แนบทำงานผ่าน Teams bot file APIs
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในพื้นที่จัดเก็บ M365 (SharePoint/OneDrive) เพย์โหลด Webhook มีเพียง HTML stub ไม่ใช่ไบต์ไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งแบบเน้นไฟล์อย่างชัดเจน ให้ใช้ `action=upload-file` พร้อม `media` / `filePath` / `path`; `message` ที่ไม่บังคับจะกลายเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` จะแทนที่ชื่อที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความช่องทางที่มีรูปภาพจะถูกรับเป็นข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
โดยค่าเริ่มต้น OpenClaw ดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น แทนที่ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตโฮสต์ใดก็ได้)
ส่วนหัว Authorization จะถูกแนบเฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework) รักษารายการนี้ให้เข้มงวด (หลีกเลี่ยงส่วนต่อท้ายแบบหลายผู้เช่า)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ใน DM โดยใช้โฟลว์ FileConsentCard (ในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่ต้องมี                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **แชตกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องมี `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | อินไลน์ที่เข้ารหัส Base64                        | ใช้งานได้ทันที                            |

### เหตุผลที่แชตกลุ่มต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (ปลายทาง Graph API `/me/drive` ใช้งานไม่ได้กับข้อมูลประจำตัวของแอปพลิเคชัน) ในการส่งไฟล์ในแชตกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ, เปิดใช้งานลิงก์แชร์ต่อผู้ใช้

2. **ให้ความยินยอมของผู้ดูแลระบบ** สำหรับผู้เช่า

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
| เฉพาะ `Sites.ReadWrite.All`              | ลิงก์แชร์ทั่วทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์ต่อผู้ใช้ (เฉพาะสมาชิกแชตเข้าถึงได้)      |

การแชร์ต่อผู้ใช้ปลอดภัยกว่า เนื่องจากเฉพาะผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะย้อนกลับไปใช้การแชร์ทั่วทั้งองค์กร

### พฤติกรรมสำรอง

| สถานการณ์                                          | ผลลัพธ์                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์            |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว), ส่งเฉพาะข้อความ |
| แชตส่วนตัว + ไฟล์                              | โฟลว์ FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint)    |
| ทุกบริบท + รูปภาพ                               | อินไลน์ที่เข้ารหัส Base64 (ทำงานได้โดยไม่ต้องใช้ SharePoint)   |

### ตำแหน่งที่จัดเก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกจัดเก็บในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพล Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบเนทีฟ)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Gateway บันทึกคะแนนโหวตไว้ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลยังไม่โพสต์สรุปผลโดยอัตโนมัติ (ตรวจสอบไฟล์ที่เก็บข้อมูลหากจำเป็น)

## การ์ดนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนาของ Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` แล้ว ข้อความของ message จะเป็นตัวเลือก

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

สำหรับรายละเอียดรูปแบบ target โปรดดู [รูปแบบ target](#target-formats) ด้านล่าง

## รูปแบบ target

target ของ MSTeams ใช้คำนำหน้าเพื่อแยกระหว่างผู้ใช้และการสนทนา:

| ประเภท target        | รูปแบบ                           | ตัวอย่าง                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)    | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)               |
| กลุ่ม/ช่อง          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/ช่อง (ดิบ)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`)       |

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
หากไม่มีคำนำหน้า `user:` ชื่อจะใช้ค่าเริ่มต้นเป็นการค้นหากลุ่มหรือทีม ใช้ `user:` เสมอเมื่อกำหนดเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกทำได้เฉพาะ **หลังจาก** ผู้ใช้มีการโต้ตอบแล้วเท่านั้น เพราะเราจะเก็บการอ้างอิงการสนทนา ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมด้วย allowlist

## ID ของทีมและช่อง (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์ query `groupId` ใน URL ของ Teams **ไม่ใช่** ID ทีมที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จาก path ของ URL แทน:

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

- คีย์ทีม = path segment หลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`; tenant รุ่นเก่าอาจแสดง `@thread.skype` ซึ่งใช้ได้เช่นกัน)
- คีย์ช่อง = path segment หลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ละเว้น** พารามิเตอร์ query `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw นั่นคือ Microsoft Entra group ID ไม่ใช่ Bot Framework conversation ID ที่ใช้ในกิจกรรม Teams ขาเข้า

## ช่องส่วนตัว

บอทรองรับช่องส่วนตัวอย่างจำกัด:

| ฟีเจอร์                      | ช่องมาตรฐาน       | ช่องส่วนตัว            |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอท                | ใช่               | จำกัด                  |
| ข้อความแบบเรียลไทม์ (webhook) | ใช่               | อาจไม่ทำงาน            |
| สิทธิ์ RSC                   | ใช่               | อาจทำงานต่างออกไป      |
| @mentions                    | ใช่               | หากเข้าถึงบอทได้       |
| ประวัติ Graph API            | ใช่               | ใช่ (พร้อมสิทธิ์)      |

**วิธีเลี่ยงหากช่องส่วนตัวไม่ทำงาน:**

1. ใช้ช่องมาตรฐานสำหรับการโต้ตอบกับบอท
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความถึงบอทโดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงข้อมูลย้อนหลัง (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาทั่วไป

- **รูปภาพไม่แสดงในช่อง:** สิทธิ์ Graph หรือการยินยอมจากผู้ดูแลระบบหายไป ติดตั้งแอป Teams ใหม่ แล้วปิด Teams ทั้งหมดและเปิดใหม่
- **ไม่มีการตอบกลับในช่อง:** โดยค่าเริ่มต้นจำเป็นต้องมี mentions; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าแยกตามทีม/ช่อง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบและเพิ่มแอปใหม่ แล้วปิด Teams ทั้งหมดเพื่อรีเฟรช
- **401 Unauthorized จาก webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายความว่า endpoint เข้าถึงได้ แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ สร้างไอคอน PNG ที่ถูกต้อง (32x32 สำหรับ `outline.png`, 192x192 สำหรับ `color.png`)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชตอื่น ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีให้การเปลี่ยนแปลงเผยแพร่
- **"Something went wrong" ขณะอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบเนื้อหา response เพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" - วิธีนี้มักเลี่ยงข้อจำกัด sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอททุกตัวอักษร
2. อัปโหลดแอปอีกครั้งและติดตั้งใหม่ในทีม/แชต
3. ตรวจสอบว่าผู้ดูแลระบบองค์กรของคุณบล็อกสิทธิ์ RSC หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม, `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## อ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [พอร์ทัลนักพัฒนา Teams](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมา manifest ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความช่องด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [เอกสารอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอท Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (ช่อง/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอท

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels) - ช่องทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนและขั้นตอนการจับคู่ผ่าน DM
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) - การกำหนดเส้นทาง session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
