---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T09:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความและไฟล์แนบ DM แล้ว; การส่งไฟล์ในช่อง/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats)) ส่งโพลผ่าน Adaptive Cards การดำเนินการกับข้อความแสดง `upload-file` อย่างชัดเจนสำหรับการส่งที่เริ่มจากไฟล์ก่อน

## Plugin ที่มาพร้อมชุด

Microsoft Teams จัดส่งเป็น Plugin ที่มาพร้อมชุดใน OpenClaw รุ่นปัจจุบัน ดังนั้นจึงไม่จำเป็นต้องติดตั้งแยกต่างหากในบิลด์แพ็กเกจปกติ

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ที่มาพร้อมชุด ให้ติดตั้งแพ็กเกจ npm ปัจจุบันเมื่อมีการเผยแพร่:

```bash
openclaw plugins install @openclaw/msteams
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว ให้ใช้บิลด์ OpenClaw แบบแพ็กเกจปัจจุบันหรือพาธ checkout ภายในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

Checkout ภายในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอต การสร้าง manifest และการสร้างข้อมูลประจำตัวในคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI อยู่ในสถานะพรีวิวในขณะนี้ คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรุ่นได้
</Note>

**2. เริ่ม tunnel** (Teams ไม่สามารถเข้าถึง localhost ได้)

ติดตั้งและยืนยันตัวตน devtunnel CLI หากยังไม่ได้ทำ ([คู่มือเริ่มต้นใช้งาน](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started))

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
- สร้างและอัปโหลด Teams app manifest (พร้อมไอคอน)
- ลงทะเบียนบอต (จัดการโดย Teams ตามค่าเริ่มต้น — ไม่ต้องใช้การสมัครใช้งาน Azure)

เอาต์พุตจะแสดง `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** — จดค่าเหล่านี้ไว้สำหรับขั้นตอนถัดไป และยังเสนอให้ติดตั้งแอปใน Teams โดยตรงด้วย

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

`teams app create` จะแจ้งให้คุณติดตั้งแอป — เลือก "ติดตั้งใน Teams" หากคุณข้ามขั้นตอนนี้ คุณสามารถรับลิงก์ภายหลังได้:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงานได้**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้รันการวินิจฉัยครอบคลุมการลงทะเบียนบอต การกำหนดค่าแอป AAD ความถูกต้องของ manifest และการตั้งค่า SSO

สำหรับการปรับใช้ใน production ให้พิจารณาใช้ [การยืนยันตัวตนแบบ federated](/th/channels/msteams#federated-authentication-certificate-plus-managed-identity) (ใบรับรองหรือ managed identity) แทน client secrets

<Note>
แชตกลุ่มถูกบล็อกตามค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ต้องถูกกล่าวถึง)
</Note>

## เป้าหมาย

- คุยกับ OpenClaw ผ่าน DM, แชตกลุ่ม หรือช่องของ Teams
- ทำให้การกำหนดเส้นทางแน่นอน: การตอบกลับจะกลับไปยังช่องที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมช่องที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องกล่าวถึง เว้นแต่จะกำหนดค่าไว้เป็นอย่างอื่น)

## การเขียนค่ากำหนด

ตามค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดตค่ากำหนดที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object IDs ที่คงที่
- อย่าพึ่งพาการจับคู่ UPN/ชื่อที่แสดงสำหรับ allowlist — ค่าเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงตามค่าเริ่มต้น; เลือกเปิดใช้อย่างชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- wizard สามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลประจำตัวอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อก เว้นแต่คุณเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อเขียนทับค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งใดสามารถทริกเกอร์ในแชตกลุ่ม/ช่องได้ (fallback ไปที่ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ (ยังคงต้องกล่าวถึงตามค่าเริ่มต้น)
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

- จำกัดขอบเขตการตอบกลับกลุ่ม/ช่องโดยระบุ teams และ channels ใต้ `channels.msteams.teams`
- คีย์ควรใช้ Teams conversation IDs ที่คงที่จากลิงก์ Teams ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนได้
- เมื่อ `groupPolicy="allowlist"` และมี teams allowlist อยู่ จะยอมรับเฉพาะ teams/channels ที่ระบุไว้เท่านั้น (ต้องถูกกล่าวถึง)
- configure wizard รับรายการ `Team/Channel` และจัดเก็บให้คุณ
- เมื่อเริ่มต้น OpenClaw จะแปลงชื่อ allowlist ของ team/channel และผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping; ชื่อ team/channel ที่แปลงไม่ได้จะถูกเก็บไว้ตามที่พิมพ์ แต่ถูกเพิกเฉยสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น เว้นแต่เปิดใช้ `channels.msteams.dangerouslyAllowNameMatching: true`

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

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams plugin พร้อมใช้งาน (มาพร้อมชุดในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอตและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams เข้าไปใน team (หรือ scope ส่วนบุคคลสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) และเริ่ม gateway
6. gateway จะฟังทราฟฟิก Webhook ของ Bot Framework ที่ `/api/messages` ตามค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
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
การสร้างบอตแบบ multi-tenant ใหม่ถูกเลิกใช้หลัง 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่
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
   - Production: `https://your-domain.com/api/messages`
   - การพัฒนาภายในเครื่อง: ใช้ tunnel (ดู [การพัฒนาภายในเครื่อง](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้ช่อง Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

### ขั้นตอนที่ 5: สร้าง Teams App Manifest

- รวมรายการ `bot` พร้อม `botId = <App ID>`
- Scopes: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ใน personal scope)
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

ช่อง Teams จะเริ่มโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและมีค่ากำหนด `msteams` พร้อมข้อมูลประจำตัว

</details>

## การยืนยันตัวตนแบบ federated (ใบรับรองพร้อม managed identity)

> เพิ่มใน 2026.4.11

สำหรับการปรับใช้ใน production OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่า client secrets มีสองวิธีให้ใช้:

### ตัวเลือก A: การยืนยันตัวตนด้วยใบรับรอง

ใช้ใบรับรอง PEM ที่ลงทะเบียนกับการลงทะเบียนแอป Entra ID ของคุณ

**การตั้งค่า:**

1. สร้างหรือรับใบรับรอง (รูปแบบ PEM พร้อม private key)
2. ใน Entra ID → App Registration → **Certificates & secrets** → **Certificates** → อัปโหลดใบรับรองสาธารณะ

**ค่ากำหนด:**

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

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน เหมาะสำหรับการปรับใช้บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity พร้อมใช้งาน

**วิธีการทำงาน:**

1. บอต pod/VM มี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity กับการลงทะเบียนแอป Entra ID
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับโทเค็นจาก Azure IMDS endpoint (`169.254.169.254`)
4. โทเค็นถูกส่งให้ Teams SDK สำหรับการยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- federated identity credential ที่สร้างไว้บนการลงทะเบียนแอป Entra ID
- การเข้าถึงเครือข่ายไปยัง IMDS (`169.254.169.254:80`) จาก pod/VM

**ค่ากำหนด (system-assigned managed identity):**

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
2. **สร้างข้อมูลประจำตัวแบบ federated identity credential** บนการลงทะเบียนแอป Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **เพิ่มคำอธิบายประกอบให้บัญชีบริการ Kubernetes** ด้วย app client ID:

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

5. **ตรวจสอบการเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) — หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบชนิดการตรวจสอบสิทธิ์

| วิธี                  | การกำหนดค่า                                   | ข้อดี                          | ข้อเสีย                                      |
| -------------------- | ---------------------------------------------- | ------------------------------ | -------------------------------------------- |
| **Client secret**    | `appPassword`                                  | ตั้งค่าได้ง่าย                 | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า        |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ไม่มี shared secret ผ่านเครือข่าย | มีภาระในการจัดการ certificate                |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่าน, ไม่มี secret ให้จัดการ | ต้องใช้โครงสร้างพื้นฐาน Azure                |

**พฤติกรรมเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การตรวจสอบสิทธิ์แบบ client secret เป็นค่าเริ่มต้น การกำหนดค่าที่มีอยู่จะยังทำงานต่อไปได้โดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (การทำ tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ dev tunnel แบบถาวรเพื่อให้ URL ของคุณคงเดิมในทุกเซสชัน:

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

## การทดสอบบอต

**เรียกใช้การวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียนบอต, แอป AAD, manifest และการกำหนดค่า SSO ในครั้งเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ใช้ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหาบอตใน Teams แล้วส่ง DM
3. ตรวจสอบบันทึก Gateway สำหรับกิจกรรมขาเข้า

## ตัวแปรสภาพแวดล้อม

สามารถตั้งค่าคีย์การกำหนดค่าทั้งหมดผ่านตัวแปรสภาพแวดล้อมแทนได้:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ, ไม่จำเป็นสำหรับการตรวจสอบสิทธิ์)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ MI ที่ผู้ใช้กำหนด)

## การดำเนินการข้อมูลสมาชิก

OpenClaw เปิดเผยการดำเนินการ `member-info` ที่มี Graph รองรับสำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถแปลงรายละเอียดสมาชิกช่อง (ชื่อที่แสดง, อีเมล, บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อมความยินยอมจากผู้ดูแลระบบ

การดำเนินการนี้ถูกควบคุมด้วย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้เมื่อมีข้อมูลประจำตัว Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความช่อง/กลุ่มล่าสุดที่จะถูกห่อเข้าไปใน prompt
- ถอยกลับไปใช้ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้ (ค่าเริ่มต้น 50)
- ประวัติ thread ที่ดึงมาจะถูกกรองด้วย allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการ seed บริบท thread จะรวมเฉพาะข้อความจากผู้ส่งที่อนุญาตเท่านั้น
- บริบทไฟล์แนบที่อ้างถึง (`ReplyTo*` ที่ได้มาจาก HTML การตอบกลับของ Teams) ปัจจุบันถูกส่งต่อไปตามที่ได้รับ
- กล่าวอีกนัยหนึ่ง allowlist จะควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ วันนี้มีเพียงเส้นทางบริบทเสริมบางเส้นทางเท่านั้นที่ถูกกรอง
- สามารถจำกัดประวัติ DM ได้ด้วย `channels.msteams.dmHistoryLimit` (turn ของผู้ใช้) การแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ Teams RSC ปัจจุบัน (manifest)

ต่อไปนี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ใน manifest แอป Teams ของเรา สิทธิ์เหล่านี้ใช้ได้เฉพาะภายในทีม/แชตที่ติดตั้งแอปไว้เท่านั้น

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
- `bots[].scopes` ต้องรวม surface ที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- ต้องใช้ `bots[].supportsFiles: true` สำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล
- `authorization.permissions.resourceSpecific` ต้องรวมการอ่าน/ส่งของช่อง หากคุณต้องการทราฟฟิกของช่อง

### การอัปเดตแอปที่มีอยู่

หากต้องการอัปเดตแอป Teams ที่ติดตั้งไว้แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

หลังอัปเดต ให้ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล และ **ปิด Teams อย่างสมบูรณ์แล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

<details>
<summary>การอัปเดต manifest ด้วยตนเอง (โดยไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัด zip ใหม่** สำหรับ manifest พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **Teams Admin Center:** แอป Teams → จัดการแอป → ค้นหาแอปของคุณ → อัปโหลดเวอร์ชันใหม่
   - **Sideload:** ใน Teams → แอป → จัดการแอปของคุณ → อัปโหลดแอปแบบกำหนดเอง

</details>

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อใช้ **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว, ไม่มีสิทธิ์ Graph API)

ทำงานได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความในช่อง
- ส่งเนื้อหา **ข้อความ** ของข้อความในช่อง
- รับไฟล์แนบของ **ส่วนบุคคล (DM)**

ไม่ทำงาน:

- **รูปภาพหรือเนื้อหาไฟล์** ของช่อง/กลุ่ม (payload มีเฉพาะ HTML stub)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจากเหตุการณ์ Webhook แบบสด)

### เมื่อใช้ **Teams RSC + สิทธิ์ Microsoft Graph Application**

เพิ่มความสามารถ:

- ดาวน์โหลดเนื้อหาที่โฮสต์ไว้ (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความช่อง/แชตผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ             | สิทธิ์ RSC             | Graph API                                  |
| ----------------------- | ---------------------- | ------------------------------------------ |
| **ข้อความแบบเรียลไทม์** | ใช่ (ผ่าน Webhook)     | ไม่ใช่ (ทำได้เฉพาะ polling)               |
| **ข้อความย้อนหลัง**     | ไม่ใช่                 | ใช่ (สามารถค้นหาประวัติได้)               |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ app manifest     | ต้องมีความยินยอมจากผู้ดูแลระบบ + token flow |
| **ทำงานแบบออฟไลน์**    | ไม่ใช่ (ต้องกำลังรันอยู่) | ใช่ (ค้นหาได้ทุกเวลา)                     |

**สรุป:** RSC ใช้สำหรับการฟังแบบเรียลไทม์ ส่วน Graph API ใช้สำหรับการเข้าถึงย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไประหว่างออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมีความยินยอมจากผู้ดูแลระบบ)

## สื่อและประวัติที่เปิดใช้ Graph (จำเป็นสำหรับช่อง)

หากคุณต้องการรูปภาพ/ไฟล์ใน **ช่อง** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ความยินยอมจากผู้ดูแลระบบ

1. ใน Entra ID (Azure AD) **App Registration** ให้เพิ่ม **สิทธิ์ Application** ของ Microsoft Graph:
   - `ChannelMessage.Read.All` (ไฟล์แนบช่อง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชตกลุ่ม)
2. **ให้ความยินยอมจากผู้ดูแลระบบ** สำหรับ tenant
3. เพิ่มเวอร์ชัน **manifest** ของแอป Teams, อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ปิด Teams อย่างสมบูรณ์แล้วเปิดใหม่** เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการกล่าวถึงผู้ใช้:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ในการสนทนา อย่างไรก็ตาม หากคุณต้องการค้นหาและกล่าวถึงผู้ใช้ที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** แบบไดนามิก ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมจากผู้ดูแลระบบ

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน HTTP Webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับจาก LLM ช้า) คุณอาจเห็น:

- Gateway หมดเวลา
- Teams ลองส่งข้อความซ้ำ (ทำให้เกิดรายการซ้ำ)
- คำตอบที่ถูกทิ้ง

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งคำตอบเชิงรุก แต่คำตอบที่ช้ามากยังอาจทำให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าสำคัญ (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลรับรองของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: รายการอนุญาตสำหรับ DM (แนะนำให้ใช้ AAD object IDs) ตัวช่วยตั้งค่าจะแปลงชื่อเป็น ID ระหว่างการตั้งค่าเมื่อมีสิทธิ์เข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้การจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางตรงด้วยชื่อทีม/ช่องทางอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดชิ้นข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแยกตามความยาว
- `channels.msteams.mediaAllowHosts`: รายการอนุญาตสำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: รายการอนุญาตสำหรับแนบส่วนหัว Authorization เมื่อ retry สื่อ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: ต้องมี @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: ค่าทับต่อทีม
- `channels.msteams.teams.<teamId>.requireMention`: ค่าทับต่อทีม
- `channels.msteams.teams.<teamId>.tools`: ค่าทับนโยบายเครื่องมือต่อทีมโดยค่าเริ่มต้น (`allow`/`deny`/`alsoAllow`) ที่ใช้เมื่อไม่มีค่าทับของช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: ค่าทับนโยบายเครื่องมือต่อผู้ส่งต่อทีมโดยค่าเริ่มต้น (รองรับ wildcard `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ค่าทับต่อช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ค่าทับต่อช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: ค่าทับนโยบายเครื่องมือต่อช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: ค่าทับนโยบายเครื่องมือต่อผู้ส่งต่อช่องทาง (รองรับ wildcard `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (คีย์รุ่นเก่าที่ไม่มีคำนำหน้ายังคงแมปเป็น `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดการทำงานข้อมูลสมาชิกที่ใช้ Graph อยู่เบื้องหลัง (ค่าเริ่มต้น: เปิดเมื่อมีข้อมูลรับรอง Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน — `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (federated + การยืนยันตัวตนด้วยใบรับรอง)
- `channels.msteams.certificateThumbprint`: thumbprint ของใบรับรอง (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `channels.msteams.useManagedIdentity`: เปิดการยืนยันตัวตนด้วย managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ managed identity แบบกำหนดโดยผู้ใช้
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชทกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชทกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบ agent มาตรฐาน (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดเทียบกับโพสต์

Teams เพิ่งเปิดตัวรูปแบบ UI ช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                    | คำอธิบาย                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (คลาสสิก)      | ข้อความแสดงเป็นการ์ดพร้อมการตอบกลับแบบเธรดด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **Threads** (คล้าย Slack) | ข้อความไหลเรียงเป็นเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องทางใช้รูปแบบ UI ใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางแบบ Threads → คำตอบจะแสดงซ้อนอย่างไม่เหมาะสม
- `top-level` ในช่องทางแบบ Posts → คำตอบจะแสดงเป็นโพสต์ระดับบนสุดแยกกันแทนที่จะอยู่ในเธรด

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

- **DMs:** รูปภาพและไฟล์แนบใช้งานได้ผ่าน Teams bot file APIs
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในพื้นที่เก็บข้อมูล M365 (SharePoint/OneDrive) payload ของ Webhook มีเพียง HTML stub ไม่ใช่ไบต์ไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบในช่องทาง
- สำหรับการส่งที่เริ่มจากไฟล์อย่างชัดเจน ให้ใช้ `action=upload-file` พร้อม `media` / `filePath` / `path`; `message` แบบไม่บังคับจะเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` จะทับชื่อที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความช่องทางที่มีรูปภาพจะถูกรับเป็นข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
โดยค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น ทับค่าได้ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
ส่วนหัว Authorization จะแนบเฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework) เก็บรายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบหลาย tenant)

## การส่งไฟล์ในแชทกลุ่ม

บอตสามารถส่งไฟล์ใน DMs โดยใช้ flow FileConsentCard (มีในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชทกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่ต้องมี                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **แชทกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องมี `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | เข้ารหัส Base64 แบบ inline                        | ใช้งานได้ทันที                            |

### เหตุผลที่แชทกลุ่มต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (endpoint Graph API `/me/drive` ใช้ไม่ได้กับ application identities) ในการส่งไฟล์ในแชทกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ เปิดใช้ลิงก์แชร์ต่อผู้ใช้

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

### ลักษณะการแชร์

| สิทธิ์                              | ลักษณะการแชร์                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` เท่านั้น              | ลิงก์แชร์ทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์ต่อผู้ใช้ (เฉพาะสมาชิกแชทเข้าถึงได้)      |

การแชร์ต่อผู้ใช้ปลอดภัยกว่า เพราะมีเพียงผู้เข้าร่วมแชทเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback ไปใช้การแชร์ทั้งองค์กร

### ลักษณะ fallback

| สถานการณ์                                          | ผลลัพธ์                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| แชทกลุ่ม + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์            |
| แชทกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว), ส่งเฉพาะข้อความ |
| แชทส่วนตัว + ไฟล์                              | flow FileConsentCard (ใช้งานได้โดยไม่ต้องมี SharePoint)    |
| ทุกบริบท + รูปภาพ                               | เข้ารหัส Base64 แบบ inline (ใช้งานได้โดยไม่ต้องมี SharePoint)   |

### ตำแหน่งที่เก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกเก็บในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพล Teams เป็น Adaptive Cards (ไม่มี API โพล Teams แบบ native)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- คะแนนโหวตถูกบันทึกโดย Gateway ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลยังไม่โพสต์สรุปผลอัตโนมัติ (ตรวจสอบไฟล์ store หากจำเป็น)

## การ์ดการนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนา Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` แล้ว ข้อความ message จะไม่บังคับ

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

สำหรับรายละเอียดรูปแบบ target ดู [รูปแบบเป้าหมาย](#target-formats) ด้านล่าง

## รูปแบบเป้าหมาย

เป้าหมาย MSTeams ใช้คำนำหน้าเพื่อแยกระหว่างผู้ใช้และการสนทนา:

| ประเภทเป้าหมาย         | รูปแบบ                           | ตัวอย่าง                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)      | `user:<display-name>`            | `user:John Smith` (ต้องมี Graph API)              |
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

**ตัวอย่างเครื่องมือของ Agent:**

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
หากไม่มีคำนำหน้า `user:` ชื่อจะใช้การค้นหาแบบกลุ่มหรือทีมเป็นค่าเริ่มต้น ให้ใช้ `user:` เสมอเมื่อระบุเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกจะทำได้ **หลังจาก** ผู้ใช้โต้ตอบแล้วเท่านั้น เพราะเราจะจัดเก็บการอ้างอิงการสนทนาไว้ ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมด้วยรายการที่อนุญาต

## ID ของทีมและช่องทาง (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์ query `groupId` ใน URL ของ Teams **ไม่ใช่** ID ทีมที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จาก path ของ URL แทน:

**URL ของทีม:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID การสนทนาของทีม (ให้ URL-decode ค่านี้)
```

**URL ของช่องทาง:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID ช่องทาง (ให้ URL-decode ค่านี้)
```

**สำหรับ config:**

- คีย์ทีม = path segment หลัง `/team/` (URL-decoded เช่น `19:Bk4j...@thread.tacv2`; tenant รุ่นเก่าอาจแสดง `@thread.skype` ซึ่งก็ใช้ได้เช่นกัน)
- คีย์ช่องทาง = path segment หลัง `/channel/` (URL-decoded)
- **ละเว้น** พารามิเตอร์ query `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw ค่านี้คือ ID กลุ่มของ Microsoft Entra ไม่ใช่ ID การสนทนาของ Bot Framework ที่ใช้ในกิจกรรม Teams ขาเข้า

## ช่องทางส่วนตัว

บอทรองรับช่องทางส่วนตัวได้จำกัด:

| ฟีเจอร์                      | ช่องทางมาตรฐาน | ช่องทางส่วนตัว       |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอท             | ใช่               | จำกัด                |
| ข้อความแบบเรียลไทม์ (Webhook) | ใช่               | อาจไม่ทำงาน           |
| สิทธิ์ RSC              | ใช่               | อาจมีพฤติกรรมต่างออกไป |
| @mentions                    | ใช่               | หากบอทเข้าถึงได้   |
| ประวัติ Graph API            | ใช่               | ใช่ (พร้อมสิทธิ์) |

**วิธีเลี่ยงปัญหาหากช่องทางส่วนตัวใช้งานไม่ได้:**

1. ใช้ช่องทางมาตรฐานสำหรับการโต้ตอบกับบอท
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความหาบอทโดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงประวัติ (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในช่องทาง:** ไม่มีสิทธิ์ Graph หรือขาดการยินยอมจากผู้ดูแลระบบ ติดตั้งแอป Teams ใหม่ แล้วปิดและเปิด Teams ใหม่ทั้งหมด
- **ไม่มีการตอบกลับในช่องทาง:** ตามค่าเริ่มต้นต้องมีการ mention; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าแยกตามทีม/ช่องทาง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบและเพิ่มแอปใหม่ แล้วปิด Teams ทั้งหมดเพื่อรีเฟรช
- **401 Unauthorized จาก Webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT หมายความว่า endpoint เข้าถึงได้แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ สร้างไอคอน PNG ที่ถูกต้อง (32x32 สำหรับ `outline.png`, 192x192 สำหรับ `color.png`)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชทอื่น ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การเผยแพร่มีผล
- **"Something went wrong" ระหว่างอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด browser DevTools (F12) → แท็บ Network แล้วตรวจสอบเนื้อหาการตอบกลับเพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" วิธีนี้มักหลีกเลี่ยงข้อจำกัด sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอทคุณทุกตัวอักษร
2. อัปโหลดแอปใหม่และติดตั้งใหม่ในทีม/แชท
3. ตรวจสอบว่าผู้ดูแลระบบองค์กรของคุณบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม, `ChatMessage.Read.Chat` สำหรับแชทกลุ่ม

## อ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมา manifest ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความช่องทางด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [ข้อมูลอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอท Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (ช่องทาง/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอท

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และ flow การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
