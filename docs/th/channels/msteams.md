---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:12:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความ + ไฟล์แนบใน DM; การส่งไฟล์ในช่อง/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats)) Poll จะถูกส่งผ่าน Adaptive Cards การกระทำของข้อความเปิดเผย `upload-file` อย่างชัดเจนสำหรับการส่งที่เริ่มจากไฟล์ก่อน

## Plugin ที่บันเดิลมา

Microsoft Teams มาพร้อมเป็น Plugin ที่บันเดิลใน OpenClaw รุ่นปัจจุบัน ดังนั้นจึงไม่จำเป็นต้องติดตั้งแยกต่างหากในบิลด์แพ็กเกจปกติ

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ที่บันเดิลมา ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้แพ็กเกจเปล่าเพื่อตามแท็กรีลีสทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

เช็กเอาต์ภายในเครื่อง (เมื่อรันจากรีโป git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอต การสร้าง manifest และการสร้างข้อมูลประจำตัวได้ในคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI ปัจจุบันอยู่ในช่วง preview คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรีลีสได้
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
ต้องใช้ `--allow-anonymous` เพราะ Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ แต่คำขอบอตขาเข้าทุกรายการยังคงถูกตรวจสอบโดย Teams SDK โดยอัตโนมัติ
</Note>

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (แต่ URL เหล่านี้อาจเปลี่ยนในแต่ละเซสชัน)

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
- ลงทะเบียนบอต (จัดการโดย Teams เป็นค่าเริ่มต้น - ไม่ต้องมี Azure subscription)

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

`teams app create` จะแจ้งให้คุณติดตั้งแอป - เลือก "Install in Teams" หากคุณข้ามไป คุณสามารถรับลิงก์ภายหลังได้:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงาน**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้รันการวินิจฉัยครอบคลุมการลงทะเบียนบอต การกำหนดค่าแอป AAD ความถูกต้องของ manifest และการตั้งค่า SSO

สำหรับการปรับใช้ใน production ให้พิจารณาใช้ [federated authentication](/th/channels/msteams#federated-authentication-certificate-plus-managed-identity) (ใบรับรองหรือ managed identity) แทน client secrets

<Note>
แชทกลุ่มถูกบล็อกเป็นค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ต้องถูกกล่าวถึงก่อน)
</Note>

## เป้าหมาย

- คุยกับ OpenClaw ผ่าน Teams DM, แชทกลุ่ม หรือช่อง
- รักษาการกำหนดเส้นทางให้กำหนดได้แน่นอน: การตอบกลับจะกลับไปยังช่องที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมช่องที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องมีการกล่าวถึง เว้นแต่กำหนดค่าเป็นอย่างอื่น)

## การเขียน config

โดยค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดต config ที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่เสถียร หรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ เช่น `accessGroup:core-team`
- อย่าพึ่งพาการจับคู่ UPN/display-name สำหรับ allowlist - ค่าเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงเป็นค่าเริ่มต้น; เปิดใช้อย่างชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- wizard สามารถ resolve ชื่อเป็น ID ผ่าน Microsoft Graph เมื่อข้อมูลประจำตัวอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อกเว้นแต่คุณเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งหรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ใดสามารถทริกเกอร์ในแชทกลุ่ม/ช่องได้ (fallback ไปที่ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ยังคงต้องถูกกล่าวถึงเป็นค่าเริ่มต้น)
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

- จำกัดขอบเขตการตอบกลับในกลุ่ม/ช่องโดยระบุ teams และ channels ภายใต้ `channels.msteams.teams`
- คีย์ควรใช้ Teams conversation ID ที่เสถียรจากลิงก์ Teams ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้
- เมื่อมี `groupPolicy="allowlist"` และมี teams allowlist อยู่ จะยอมรับเฉพาะ teams/channels ที่ระบุไว้เท่านั้น (ต้องถูกกล่าวถึง)
- configure wizard ยอมรับรายการ `Team/Channel` และจัดเก็บให้คุณ
- เมื่อเริ่มต้น OpenClaw จะ resolve ชื่อ team/channel และชื่อใน user allowlist เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping ลง log; ชื่อ team/channel ที่ resolve ไม่ได้จะถูกเก็บตามที่พิมพ์ แต่ถูกละเว้นสำหรับการกำหนดเส้นทางเป็นค่าเริ่มต้น เว้นแต่เปิดใช้งาน `channels.msteams.dangerouslyAllowNameMatching: true`

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

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน (บันเดิลในรีลีสปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **Teams app package** ที่อ้างอิงบอตและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงใน team (หรือขอบเขตส่วนตัวสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปร env) แล้วเริ่ม Gateway
6. Gateway จะรับฟังทราฟฟิก Bot Framework Webhook บน `/api/messages` เป็นค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | ฟิลด์              | ค่า                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือก Azure subscription ของคุณ                           |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่                               |
   | **Pricing tier**   | **Free** สำหรับ dev/testing                                 |
   | **Type of App**    | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
การสร้างบอต multi-tenant ใหม่ถูกเลิกใช้หลัง 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่
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

### ขั้นตอนที่ 4: เปิดใช้งาน Teams Channel

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

### ขั้นตอนที่ 5: สร้าง Teams App Manifest

- รวมรายการ `bot` ที่มี `botId = <App ID>`
- Scopes: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขตส่วนตัว)
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

ช่อง Teams จะเริ่มโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและมี config `msteams` พร้อมข้อมูลประจำตัว

</details>

## Federated authentication (ใบรับรองพร้อม managed identity)

> เพิ่มใน 2026.4.11

สำหรับการปรับใช้ใน production OpenClaw รองรับ **federated authentication** เป็นทางเลือกที่ปลอดภัยกว่า client secrets มีสองวิธีให้ใช้:

### ตัวเลือก A: การยืนยันตัวตนด้วยใบรับรอง

ใช้ใบรับรอง PEM ที่ลงทะเบียนกับ Entra ID app registration ของคุณ

**การตั้งค่า:**

1. สร้างหรือขอใบรับรอง (รูปแบบ PEM พร้อม private key)
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

**ตัวแปร Env:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### ตัวเลือก B: Azure Managed Identity

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน วิธีนี้เหมาะสำหรับการปรับใช้บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity พร้อมใช้งาน

**วิธีการทำงาน:**

1. pod/VM ของบอตมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity เข้ากับ Entra ID app registration
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับโทเค็นจาก Azure IMDS endpoint (`169.254.169.254`)
4. โทเค็นจะถูกส่งต่อไปยัง Teams SDK สำหรับการยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้งาน managed identity (AKS workload identity, App Service, VM)
- สร้าง federated identity credential บน Entra ID app registration แล้ว
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

**การกำหนดค่า (managed identity ที่ระบบกำหนด):**

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
2. **สร้างข้อมูลประจำตัวแบบ federated identity credential** บนการลงทะเบียนแอป Entra ID:

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

5. **ตรวจสอบให้มีการเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) - หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธี                 | การกำหนดค่า                                   | ข้อดี                              | ข้อเสีย                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | --------------------------------------------- |
| **Client secret**    | `appPassword`                                  | ตั้งค่าได้ง่าย                    | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า        |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ไม่มี secret ที่แชร์ผ่านเครือข่าย | มีภาระในการจัดการ certificate                |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่าน, ไม่มี secret ให้จัดการ | ต้องมีโครงสร้างพื้นฐาน Azure             |

**พฤติกรรมเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนแบบ client secret เป็นค่าเริ่มต้น การกำหนดค่าที่มีอยู่จะยังทำงานต่อไปโดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (การทำ tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ dev tunnel แบบถาวรเพื่อให้ URL ของคุณคงเดิมข้ามเซสชัน:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

ทางเลือก: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละเซสชัน)

หาก URL ของ tunnel เปลี่ยน ให้อัปเดต endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## การทดสอบบอต

**เรียกใช้การวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียนบอต, แอป AAD, manifest และการกำหนดค่า SSO ในครั้งเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ใช้ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหาบอตใน Teams แล้วส่ง DM
3. ตรวจสอบบันทึก Gateway สำหรับ activity ขาเข้า

## ตัวแปรสภาพแวดล้อม

สามารถตั้งค่าคีย์การกำหนดค่าทั้งหมดผ่านตัวแปรสภาพแวดล้อมแทนได้:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ, ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ MI ที่ผู้ใช้กำหนด)

## การกระทำข้อมูลสมาชิก

OpenClaw เปิดเผยการกระทำ `member-info` ที่มี Graph รองรับสำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถแปลงรายละเอียดสมาชิกช่อง (ชื่อที่แสดง, อีเมล, บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อมความยินยอมจากผู้ดูแล

การกระทำนี้ถูกควบคุมด้วย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลประจำตัว Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความช่อง/กลุ่มล่าสุดที่จะถูกห่อเข้าไปในพรอมป์
- จะ fallback ไปที่ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองด้วย allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการเติมบริบทเธรดเริ่มต้นจะรวมเฉพาะข้อความจากผู้ส่งที่อนุญาตเท่านั้น
- บริบทไฟล์แนบที่อ้างอิง (`ReplyTo*` ที่มาจาก HTML การตอบกลับของ Teams) ขณะนี้ถูกส่งต่อไปตามที่ได้รับ
- กล่าวอีกอย่างคือ allowlist ควบคุมว่าใครสามารถเรียกเอเจนต์ได้; ปัจจุบันมีเพียงเส้นทางบริบทเสริมบางเส้นทางเท่านั้นที่ถูกกรอง
- สามารถจำกัดประวัติ DM ได้ด้วย `channels.msteams.dmHistoryLimit` (turn ของผู้ใช้) การเขียนทับรายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ Teams RSC ปัจจุบัน (manifest)

ต่อไปนี้คือ **resourceSpecific permissions ที่มีอยู่** ใน manifest แอป Teams ของเรา สิทธิ์เหล่านี้มีผลเฉพาะภายในทีม/แชทที่ติดตั้งแอปเท่านั้น

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

## ตัวอย่าง Teams manifest (ปกปิดข้อมูลแล้ว)

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
- ต้องมี `bots[].supportsFiles: true` สำหรับการจัดการไฟล์ในขอบเขตส่วนตัว
- `authorization.permissions.resourceSpecific` ต้องรวมการอ่าน/ส่งช่องหากคุณต้องการทราฟฟิกช่อง

### การอัปเดตแอปที่มีอยู่

หากต้องการอัปเดตแอป Teams ที่ติดตั้งแล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

หลังจากอัปเดตแล้ว ให้ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล และ **ออกจาก Teams ทั้งหมดแล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

<details>
<summary>การอัปเดต manifest ด้วยตนเอง (ไม่มี CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **zip ใหม่** สำหรับ manifest พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **Teams Admin Center:** แอป Teams → จัดการแอป → ค้นหาแอปของคุณ → อัปโหลดเวอร์ชันใหม่
   - **Sideload:** ใน Teams → แอป → จัดการแอปของคุณ → อัปโหลดแอปแบบกำหนดเอง

</details>

## ความสามารถ: RSC เท่านั้น เทียบกับ Graph

### ด้วย **Teams RSC เท่านั้น** (ติดตั้งแอปแล้ว, ไม่มีสิทธิ์ Graph API)

ทำงานได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความช่อง
- ส่งเนื้อหา **ข้อความ** ของข้อความช่อง
- รับไฟล์แนบ **ส่วนตัว (DM)**

ไม่ทำงาน:

- **รูปภาพหรือเนื้อหาไฟล์** ในช่อง/กลุ่ม (payload รวมเฉพาะ HTML stub)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจากเหตุการณ์ Webhook สด)

### ด้วย **Teams RSC + สิทธิ์ Microsoft Graph Application**

เพิ่ม:

- ดาวน์โหลด hosted contents (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความช่อง/แชทผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ            | สิทธิ์ RSC            | Graph API                              |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์** | ใช่ (ผ่าน Webhook)   | ไม่ (polling เท่านั้น)              |
| **ข้อความย้อนหลัง**     | ไม่                  | ใช่ (สามารถ query ประวัติได้)       |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ app manifest | ต้องมีความยินยอมจากผู้ดูแล + token flow |
| **ทำงานเมื่อออฟไลน์**  | ไม่ (ต้องกำลังทำงาน) | ใช่ (query ได้ทุกเวลา)              |

**สรุป:** RSC ใช้สำหรับการฟังแบบเรียลไทม์; Graph API ใช้สำหรับการเข้าถึงย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไปขณะออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมีความยินยอมจากผู้ดูแล)

## สื่อและประวัติที่เปิดใช้งาน Graph (จำเป็นสำหรับช่อง)

หากคุณต้องการรูปภาพ/ไฟล์ใน **ช่อง** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้งานสิทธิ์ Microsoft Graph และให้ความยินยอมจากผู้ดูแล

1. ใน Entra ID (Azure AD) **App Registration** ให้เพิ่ม **Application permissions** ของ Microsoft Graph:
   - `ChannelMessage.Read.All` (ไฟล์แนบช่อง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชทกลุ่ม)
2. **ให้ความยินยอมจากผู้ดูแล** สำหรับ tenant
3. เพิ่ม **เวอร์ชัน manifest** ของแอป Teams, อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ออกจาก Teams ทั้งหมดแล้วเปิดใหม่** เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการ mention ผู้ใช้:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ในการสนทนา อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้ที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** แบบไดนามิก ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมจากผู้ดูแล

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน HTTP Webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับของ LLM ช้า) คุณอาจพบ:

- Gateway timeouts
- Teams ลองส่งข้อความซ้ำ (ทำให้เกิดข้อความซ้ำ)
- การตอบกลับตกหล่น

OpenClaw จัดการเรื่องนี้โดยส่งคืนอย่างรวดเร็วและส่งการตอบกลับเชิงรุก แต่การตอบสนองที่ช้ามากอาจยังทำให้เกิดปัญหาได้

### การรองรับ Teams cloud และ service URL

เส้นทาง Teams ที่รองรับด้วย SDK นี้ได้รับการตรวจสอบแบบใช้งานจริงแล้วสำหรับ Microsoft Teams public cloud

การตอบกลับขาเข้าใช้บริบทเทิร์น Teams SDK ขาเข้า การดำเนินการเชิงรุกนอกบริบท ได้แก่ การส่ง การแก้ไข การลบ การ์ด โพล ข้อความยินยอมไฟล์ และการตอบกลับที่รันนานในคิว จะใช้ `serviceUrl` ของการอ้างอิงการสนทนาที่จัดเก็บไว้ Public cloud มีค่าเริ่มต้นเป็นสภาพแวดล้อม public cloud ของ Teams SDK และอนุญาตการอ้างอิงที่จัดเก็บไว้บนโฮสต์ Teams Connector สาธารณะ: `https://smba.trafficmanager.net/`

Public cloud เป็นค่าเริ่มต้น คุณไม่จำเป็นต้องตั้งค่า `channels.msteams.cloud` หรือ `channels.msteams.serviceUrl` สำหรับบอท public-cloud ปกติ

สำหรับ Teams cloud ที่ไม่ใช่สาธารณะ ให้ตั้งค่า `cloud` และขอบเขตเชิงรุกที่ตรงกันเมื่อ Microsoft เผยแพร่:

- `channels.msteams.cloud` เลือก Teams SDK cloud preset สำหรับการยืนยันตัวตน การตรวจสอบ JWT บริการโทเค็น และขอบเขต Graph
- `channels.msteams.serviceUrl` เลือกขอบเขตปลายทาง Bot Connector ที่ใช้ตรวจสอบการอ้างอิงการสนทนาที่จัดเก็บไว้ก่อนการส่ง การแก้ไข การลบ การ์ด โพล ข้อความยินยอมไฟล์ และการตอบกลับที่รันนานในคิวแบบเชิงรุก ต้องใช้ค่านี้สำหรับ USGov และ DoD SDK clouds สำหรับ China/21Vianet นั้น OpenClaw ใช้ SDK preset `China` และยอมรับ service URL ที่จัดเก็บ/กำหนดค่าไว้เฉพาะบนโฮสต์ช่องทาง Azure China Bot Framework

Microsoft เผยแพร่ปลายทาง Bot Connector เชิงรุกแบบสากลไว้ในส่วน [สร้างการสนทนา](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) ของเอกสารการส่งข้อความเชิงรุกของ Teams ใช้ `serviceUrl` ของกิจกรรมขาเข้าเมื่อมีให้ใช้ หากคุณต้องการปลายทางเชิงรุกแบบสากล ให้ใช้ตารางของ Microsoft

| สภาพแวดล้อม Teams | การกำหนดค่า OpenClaw                                      | `serviceUrl` เชิงรุก                              |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | ไม่ต้องกำหนดค่า cloud/serviceUrl                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | ตั้งค่า `serviceUrl`; ไม่มี Teams SDK cloud preset แยกต่างหาก | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | ใช้ `serviceUrl` ของกิจกรรมขาเข้า                 |

ตัวอย่างสำหรับ GCC ซึ่ง Microsoft จัดทำเอกสาร service URL เชิงรุกแยกต่างหาก แต่ Teams SDK ไม่เปิดเผย GCC cloud preset แยกต่างหาก:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

ตัวอย่างสำหรับ GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` ถูกจำกัดไว้เฉพาะโฮสต์ Microsoft Teams Bot Connector ที่รองรับ เมื่อกำหนดค่า service URL แล้ว OpenClaw จะตรวจสอบว่า `serviceUrl` ของการสนทนาที่จัดเก็บไว้ใช้โฮสต์เดียวกันก่อนการส่ง การแก้ไข การลบ การ์ด โพล หรือการตอบกลับที่รันนานในคิวแบบเชิงรุกจะทำงาน ด้วยการกำหนดค่า public-cloud เริ่มต้น OpenClaw จะปิดแบบไม่อนุญาตหากการสนทนาที่จัดเก็บไว้ชี้ออกนอกโฮสต์ Teams Connector สาธารณะ รับข้อความใหม่จากการสนทนาหลังจากเปลี่ยนการตั้งค่า cloud/service URL เพื่อให้การอ้างอิงการสนทนาที่จัดเก็บไว้เป็นปัจจุบัน

China/21Vianet ไม่มี URL `smba` เชิงรุกแบบสากลแยกต่างหากในตารางปลายทางเชิงรุกของ Teams จาก Microsoft กำหนดค่า `cloud: "China"` เพื่อให้ Teams SDK ใช้ปลายทางการยืนยันตัวตน โทเค็น และ JWT ของ Azure China จากนั้นการส่งเชิงรุกต้องใช้การอ้างอิงการสนทนาที่จัดเก็บไว้จากกิจกรรม China Teams ขาเข้า หรือ service URL ที่กำหนดค่าไว้อย่างชัดเจน บนขอบเขตช่องทาง Azure China Bot Framework (`*.botframework.azure.cn`) ตัวช่วย Teams ที่รองรับด้วย Graph ถูกปิดใช้งานอยู่ในขณะนี้สำหรับ `cloud: "China"` จนกว่า OpenClaw จะกำหนดเส้นทางคำขอ Graph ผ่านปลายทาง Azure China Graph

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลประจำตัวของบอต
- `channels.msteams.cloud`: สภาพแวดล้อมคลาวด์ของ Teams SDK (`Public`, `USGov`, `USGovDoD` หรือ `China`; ค่าเริ่มต้น `Public`) ตั้งค่านี้พร้อมกับ `serviceUrl` สำหรับคลาวด์ USGov/DoD SDK; China ใช้ค่าที่ SDK กำหนดไว้ล่วงหน้าและข้อมูลอ้างอิงการสนทนา Azure China Bot Framework ที่จัดเก็บไว้ โดยปิดใช้งานตัวช่วยที่อิงกับ Graph จนกว่าจะมีการใช้งานการกำหนดเส้นทาง Azure China Graph
- `channels.msteams.serviceUrl`: ขอบเขต URL บริการ Bot Connector สำหรับการทำงานเชิงรุกของ SDK คลาวด์สาธารณะใช้ค่าเริ่มต้นของ SDK; ตั้งค่านี้สำหรับ GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High หรือ DoD China ยอมรับโฮสต์ช่องทาง Azure China Bot Framework เมื่อข้อมูลอ้างอิงการสนทนาที่จัดเก็บมาจาก Teams ที่ดำเนินการโดย 21Vianet
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: รายการอนุญาต DM (แนะนำให้ใช้ AAD object ID) ตัวช่วยตั้งค่าจะแปลงชื่อเป็น ID ระหว่างการตั้งค่าเมื่อเข้าถึง Graph ได้
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้งานการจับคู่ UPN/ชื่อที่แสดงที่เปลี่ยนแปลงได้อีกครั้ง และการกำหนดเส้นทางตามชื่อทีม/ช่องทางโดยตรง
- `channels.msteams.textChunkLimit`: ขนาดชิ้นส่วนข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งชิ้นส่วนตามความยาว
- `channels.msteams.mediaAllowHosts`: รายการอนุญาตสำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: รายการอนุญาตสำหรับแนบส่วนหัว Authorization เมื่อพยายามโหลดสื่อซ้ำ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: ต้องมี @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การแทนที่รายทีม
- `channels.msteams.teams.<teamId>.requireMention`: การแทนที่รายทีม
- `channels.msteams.teams.<teamId>.tools`: การแทนที่นโยบายเครื่องมือเริ่มต้นรายทีม (`allow`/`deny`/`alsoAllow`) ที่ใช้เมื่อไม่มีการแทนที่ระดับช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: การแทนที่นโยบายเครื่องมือเริ่มต้นรายทีมต่อผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การแทนที่รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การแทนที่นโยบายเครื่องมือรายช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การแทนที่นโยบายเครื่องมือรายช่องทางต่อผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปเป็น `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดการทำงานข้อมูลสมาชิกที่อิงกับ Graph (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลประจำตัว Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน - `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (federated + การยืนยันตัวตนด้วยใบรับรอง)
- `channels.msteams.certificateThumbprint`: ลายนิ้วมือใบรับรอง (ไม่บังคับ และไม่จำเป็นสำหรับการยืนยันตัวตน)
- `channels.msteams.useManagedIdentity`: เปิดใช้งานการยืนยันตัวตนด้วย managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: ID ไคลเอนต์สำหรับ managed identity ที่ผู้ใช้กำหนด
- `channels.msteams.sharePointSiteId`: ID ไซต์ SharePoint สำหรับการอัปโหลดไฟล์ในการแชทกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในการแชทกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบเอเจนต์มาตรฐาน (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความโดยตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ ID การสนทนา:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดกับโพสต์

Teams เพิ่งเปิดตัวรูปแบบ UI ช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                    | คำอธิบาย                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (คลาสสิก)      | ข้อความแสดงเป็นการ์ดพร้อมการตอบกลับแบบเธรดอยู่ด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **Threads** (คล้าย Slack) | ข้อความไหลตามลำดับเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องทางใช้รูปแบบ UI ใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางรูปแบบ Threads → คำตอบจะปรากฏซ้อนกันอย่างไม่เหมาะสม
- `top-level` ในช่องทางรูปแบบ Posts → คำตอบจะปรากฏเป็นโพสต์ระดับบนแยกต่างหาก แทนที่จะอยู่ในเธรด

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

### ลำดับความสำคัญในการตัดสินค่า

เมื่อบอตส่งคำตอบเข้าไปในช่องทาง `replyStyle` จะถูกตัดสินค่าจากการแทนที่ที่เฉพาะเจาะจงที่สุดลงไปจนถึงค่าเริ่มต้น ค่าแรกที่ไม่ใช่ `undefined` จะถูกใช้:

1. **รายช่องทาง** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **รายทีม** — `channels.msteams.teams.<teamId>.replyStyle`
3. **ส่วนกลาง** — `channels.msteams.replyStyle`
4. **ค่าเริ่มต้นโดยนัย** — อนุมานจาก `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

หากคุณตั้งค่า `requireMention: false` แบบส่วนกลางโดยไม่มี `replyStyle` ที่ชัดเจน การกล่าวถึงในช่องทางรูปแบบ Posts จะแสดงเป็นโพสต์ระดับบน แม้ว่าขาเข้าจะเป็นการตอบกลับในเธรดก็ตาม ปักหมุด `replyStyle: "thread"` ที่ระดับส่วนกลาง ทีม หรือช่องทาง เพื่อหลีกเลี่ยงผลลัพธ์ที่ไม่คาดคิด

### การรักษาบริบทเธรด

เมื่อ `replyStyle: "thread"` มีผลและบอตถูก @mentioned จากภายในเธรดของช่องทาง OpenClaw จะแนบรากเธรดเดิมกลับเข้ากับข้อมูลอ้างอิงการสนทนาขาออก (`19:…@thread.tacv2;messageid=<root>`) เพื่อให้คำตอบลงในเธรดเดียวกัน สิ่งนี้ใช้ได้ทั้งกับการส่งแบบสด (ภายในเทิร์น) และการส่งเชิงรุกที่ทำหลังจากบริบทเทิร์นของ Bot Framework หมดอายุแล้ว (เช่น เอเจนต์ที่ทำงานนาน, คำตอบการเรียกเครื่องมือที่เข้าคิวผ่าน `mcp__openclaw__message`)

รากเธรดนำมาจาก `threadId` ที่จัดเก็บไว้ในข้อมูลอ้างอิงการสนทนา ข้อมูลอ้างอิงที่จัดเก็บรุ่นเก่าซึ่งมีมาก่อน `threadId` จะย้อนกลับไปใช้ `activityId` (กิจกรรมขาเข้าใดก็ตามที่ป้อนค่าเริ่มต้นให้การสนทนาครั้งล่าสุด) ดังนั้นการปรับใช้ที่มีอยู่จึงยังทำงานต่อได้โดยไม่ต้องป้อนค่าเริ่มต้นใหม่

เมื่อ `replyStyle: "top-level"` มีผลใช้งาน ข้อความขาเข้าจากเธรดของช่องทางจะถูกตอบเป็นโพสต์ระดับบนสุดใหม่โดยตั้งใจ — ไม่มีการแนบท้ายเธรด นี่คือพฤติกรรมที่ถูกต้องสำหรับช่องทางแบบ Threads; หากคุณเห็นโพสต์ระดับบนสุดในจุดที่คาดว่าจะเป็นการตอบกลับแบบเธรด แสดงว่า `replyStyle` ของช่องทางนั้นตั้งค่าไม่ถูกต้อง

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DM:** รูปภาพและไฟล์แนบทำงานผ่าน API ไฟล์ของบอต Teams
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในพื้นที่จัดเก็บ M365 (SharePoint/OneDrive) payload ของ Webhook มีเพียง stub แบบ HTML ไม่ใช่ไบต์ไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบในช่องทาง
- สำหรับการส่งแบบระบุไฟล์ก่อนอย่างชัดเจน ให้ใช้ `action=upload-file` พร้อม `media` / `filePath` / `path`; `message` ที่เป็นตัวเลือกจะกลายเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` จะเขียนทับชื่อที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความในช่องทางที่มีรูปภาพจะถูกรับเป็นข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
โดยค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น เขียนทับได้ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
ส่วนหัว Authorization จะถูกแนบเฉพาะกับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นคือโฮสต์ Graph + Bot Framework) คงรายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบหลาย tenant)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ใน DM โดยใช้ flow FileConsentCard (มีในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท | วิธีส่งไฟล์ | การตั้งค่าที่ต้องมี |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM** | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที |
| **แชตกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์ | ต้องมี `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | ฝังแบบเข้ารหัส Base64 | ใช้งานได้ทันที |

### เหตุผลที่แชตกลุ่มต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (endpoint Graph API `/me/drive` ใช้ไม่ได้กับข้อมูลประจำตัวแบบแอปพลิเคชัน) หากต้องการส่งไฟล์ในแชตกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - เป็นตัวเลือก เปิดใช้ลิงก์แชร์รายผู้ใช้

2. **ให้ความยินยอมจากผู้ดูแลระบบ** สำหรับ tenant

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

| สิทธิ์ | พฤติกรรมการแชร์ |
| --------------------------------------- | --------------------------------------------------------- |
| เฉพาะ `Sites.ReadWrite.All` | ลิงก์แชร์ทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกแชตเข้าถึงได้) |

การแชร์รายผู้ใช้ปลอดภัยกว่า เพราะเฉพาะผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback ไปใช้การแชร์ทั้งองค์กร

### พฤติกรรม fallback

| สถานการณ์ | ผลลัพธ์ |
| ------------------------------------------------- | -------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์ |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId` | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว), ส่งเฉพาะข้อความ |
| แชตส่วนตัว + ไฟล์ | flow FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint) |
| ทุกบริบท + รูปภาพ | ฝังแบบเข้ารหัส Base64 (ทำงานได้โดยไม่ต้องใช้ SharePoint) |

### ตำแหน่งที่จัดเก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกจัดเก็บในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพล Teams เป็น Adaptive Cards (ไม่มี API โพล Teams แบบเนทีฟ)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- คะแนนโหวตถูกบันทึกโดย gateway ใน SQLite สถานะ Plugin ของ OpenClaw ใต้ `state/openclaw.sqlite`
- ไฟล์ `msteams-polls.json` ที่มีอยู่จะถูกนำเข้าโดย `openclaw doctor --fix` ไม่ใช่โดย Plugin ที่กำลังทำงาน
- gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลยังไม่โพสต์สรุปผลโดยอัตโนมัติ และยังไม่มี CLI ผลโพลที่รองรับ

## การ์ดการนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือบทสนทนา Teams โดยใช้เครื่องมือ `message`, CLI, หรือการส่งตอบกลับปกติ OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` ข้อความของ message จะเป็นตัวเลือก ปุ่มจะแสดงผลเป็นการกระทำ submit หรือ URL ของ Adaptive Card เมนู select ยังไม่เป็นแบบเนทีฟในตัวแสดงผล Teams ดังนั้น OpenClaw จะลดระดับให้เป็นข้อความที่อ่านได้ก่อนส่ง

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

target ของ MSTeams ใช้ prefix เพื่อแยกความแตกต่างระหว่างผู้ใช้และบทสนทนา:

| ประเภท target | รูปแบบ | ตัวอย่าง |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID) | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| ผู้ใช้ (ตามชื่อ) | `user:<display-name>` | `user:John Smith` (ต้องใช้ Graph API) |
| กลุ่ม/ช่องทาง | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| กลุ่ม/ช่องทาง (ดิบ) | `<conversation-id>` | `19:abc123...@thread.tacv2` (หากมี `@thread`) |

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
หากไม่มี prefix `user:` ชื่อจะใช้ค่าเริ่มต้นเป็นการ resolve กลุ่มหรือทีม ใช้ `user:` เสมอเมื่อ target เป็นบุคคลตามชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกทำได้เฉพาะ **หลังจาก** ผู้ใช้โต้ตอบแล้วเท่านั้น เพราะเราจัดเก็บการอ้างอิงบทสนทนา ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุม allowlist

## ID ของทีมและช่องทาง (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์ query `groupId` ใน URL ของ Teams **ไม่ใช่** ID ทีมที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จาก path ของ URL แทน:

**URL ทีม:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL ช่องทาง:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**สำหรับ config:**

- คีย์ทีม = ส่วน path หลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`; tenant รุ่นเก่าอาจแสดง `@thread.skype` ซึ่งก็ใช้ได้เช่นกัน)
- คีย์ช่องทาง = ส่วน path หลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ละเว้น** พารามิเตอร์ query `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw นี่คือ ID กลุ่ม Microsoft Entra ไม่ใช่ ID บทสนทนา Bot Framework ที่ใช้ในกิจกรรม Teams ขาเข้า

## ช่องทางส่วนตัว

บอตรองรับช่องทางส่วนตัวแบบจำกัด:

| ฟีเจอร์ | ช่องทางมาตรฐาน | ช่องทางส่วนตัว |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอต | ใช่ | จำกัด |
| ข้อความเรียลไทม์ (webhook) | ใช่ | อาจไม่ทำงาน |
| สิทธิ์ RSC | ใช่ | อาจมีพฤติกรรมต่างออกไป |
| @mentions | ใช่ | หากบอตเข้าถึงได้ |
| ประวัติ Graph API | ใช่ | ใช่ (พร้อมสิทธิ์) |

**วิธีแก้ปัญหาชั่วคราวหากช่องทางส่วนตัวไม่ทำงาน:**

1. ใช้ช่องทางมาตรฐานสำหรับการโต้ตอบกับบอต
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความหาบอตโดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงประวัติ (ต้องมี `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาทั่วไป

- **รูปภาพไม่แสดงในช่องทาง:** ไม่มีสิทธิ์ Graph หรือไม่มีความยินยอมจากผู้ดูแลระบบ ติดตั้งแอป Teams ใหม่ และปิด/เปิด Teams ใหม่ทั้งหมด
- **ไม่มีการตอบกลับในช่องทาง:** โดยค่าเริ่มต้นต้องมีการ mention; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าต่อทีม/ช่องทาง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบ + เพิ่มแอปอีกครั้ง และปิด Teams ทั้งหมดเพื่อรีเฟรช
- **401 Unauthorized จาก webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายถึง endpoint เข้าถึงได้ แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ สร้างไอคอน PNG ที่ถูกต้อง (32x32 สำหรับ `outline.png`, 192x192 สำหรับ `color.png`)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชตอื่น ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีให้มีการเผยแพร่
- **"Something went wrong" เมื่ออัปโหลด:** อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network และตรวจสอบเนื้อหา response เพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลอง "Upload an app to your org's app catalog" แทน "Upload a custom app" - วิธีนี้มักข้ามข้อจำกัด sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอทคุณทุกประการ
2. อัปโหลดแอปอีกครั้งและติดตั้งใหม่ในทีม/แชต
3. ตรวจสอบว่าผู้ดูแลระบบองค์กรของคุณบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม, `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## เอกสารอ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมาแมนิเฟสต์ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความช่องทางด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [ข้อมูลอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอท Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (ช่องทาง/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอท

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนผ่าน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
