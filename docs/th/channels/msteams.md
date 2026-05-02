---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f26d6403934a654ef847aff1563500649083598cfdcb3d463890706e31480525
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความ + ไฟล์แนบในข้อความส่วนตัวแล้ว; การส่งไฟล์ในช่อง/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats)) ระบบส่งโพลผ่าน Adaptive Cards แอ็กชันข้อความเปิดเผย `upload-file` อย่างชัดเจนสำหรับการส่งที่เริ่มจากไฟล์

## Plugin ที่รวมมาให้

Microsoft Teams มาพร้อมเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน จึงไม่ต้อง
ติดตั้งแยกต่างหากในบิลด์แพ็กเกจปกติ

หากคุณใช้บิลด์เก่ากว่า หรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ที่บันเดิลไว้
ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้แพ็กเกจเปล่าเพื่ออิงตามแท็กรุ่นทางการปัจจุบัน ปักหมุด
เวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

เช็กเอาต์ในเครื่อง (เมื่อรันจากรีโพ git):

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
Teams CLI ขณะนี้ยังอยู่ในช่วงพรีวิว คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรุ่นได้
</Note>

**2. เริ่มทันเนล** (Teams เข้าถึง localhost ไม่ได้)

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
ต้องใช้ `--allow-anonymous` เพราะ Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ คำขอบอตขาเข้าแต่ละรายการยังคงถูกตรวจสอบโดย Teams SDK โดยอัตโนมัติ
</Note>

ทางเลือกอื่น: `ngrok http 3978` หรือ `tailscale funnel 3978` (แต่ตัวเลือกเหล่านี้อาจเปลี่ยน URL ในแต่ละเซสชัน)

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
- ลงทะเบียนบอต (ค่าเริ่มต้นคือ Teams จัดการให้ ไม่ต้องมีการสมัครใช้งาน Azure)

เอาต์พุตจะแสดง `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** ให้จดค่าเหล่านี้ไว้สำหรับขั้นตอนถัดไป นอกจากนี้ยังเสนอให้ติดตั้งแอปใน Teams โดยตรงด้วย

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

`teams app create` จะแจ้งให้คุณติดตั้งแอป เลือก "Install in Teams" หากคุณข้ามไป คุณสามารถรับลิงก์ภายหลังได้:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงาน**

```bash
teams app doctor <teamsAppId>
```

คำสั่งนี้รันการวินิจฉัยครอบคลุมการลงทะเบียนบอต การกำหนดค่าแอป AAD ความถูกต้องของแมนิเฟสต์ และการตั้งค่า SSO

สำหรับการดีพลอยใช้งานจริง ให้พิจารณาใช้ [การยืนยันตัวตนแบบ federated](/th/channels/msteams#federated-authentication-certificate-plus-managed-identity) (ใบรับรองหรือ managed identity) แทน client secret

<Note>
แชตกลุ่มถูกบล็อกตามค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (มีการกั้นด้วยการกล่าวถึง)
</Note>

## เป้าหมาย

- คุยกับ OpenClaw ผ่านข้อความส่วนตัว Teams, แชตกลุ่ม หรือช่อง
- รักษาการกำหนดเส้นทางให้แน่นอน: คำตอบจะกลับไปยังช่องที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมช่องที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องมีการกล่าวถึง เว้นแต่กำหนดค่าไว้เป็นอย่างอื่น)

## การเขียนค่ากำหนด

ตามค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดตค่ากำหนดที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (ข้อความส่วนตัว + กลุ่ม)

**การเข้าถึงข้อความส่วนตัว**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกละเว้นจนกว่าจะได้รับอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่เสถียร
- อย่าพึ่งพาการจับคู่ UPN/ชื่อที่แสดงสำหรับ allowlist เพราะค่าเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงตามค่าเริ่มต้น; เปิดใช้โดยชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- วิซาร์ดสามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลประจำตัวอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อก เว้นแต่คุณเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อเขียนทับค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งใดสามารถทริกเกอร์ในแชตกลุ่ม/ช่องได้ (ถอยกลับไปใช้ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (ยังคงมีการกั้นด้วยการกล่าวถึงตามค่าเริ่มต้น)
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

- จำกัดขอบเขตการตอบกลับของกลุ่ม/ช่องโดยระบุทีมและช่องภายใต้ `channels.msteams.teams`
- คีย์ควรใช้ Teams conversation ID ที่เสถียรจากลิงก์ Teams ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้
- เมื่อมี `groupPolicy="allowlist"` และมี allowlist ของทีม ระบบจะยอมรับเฉพาะทีม/ช่องที่ระบุไว้เท่านั้น (มีการกั้นด้วยการกล่าวถึง)
- วิซาร์ดกำหนดค่ายอมรับรายการ `Team/Channel` และจัดเก็บให้คุณ
- เมื่อเริ่มทำงาน OpenClaw จะแปลงชื่อทีม/ช่องและชื่อ allowlist ผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึกการแมปในล็อก; ชื่อทีม/ช่องที่แปลงไม่ได้จะถูกเก็บไว้ตามที่พิมพ์ แต่ถูกละเว้นสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น เว้นแต่เปิดใช้ `channels.msteams.dangerouslyAllowNameMatching: true`

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
<summary><strong>การตั้งค่าด้วยตนเอง (ไม่ใช้ Teams CLI)</strong></summary>

หากคุณใช้ Teams CLI ไม่ได้ คุณสามารถตั้งค่าบอตด้วยตนเองผ่าน Azure Portal

### วิธีการทำงาน

1. ตรวจสอบให้แน่ใจว่า Microsoft Teams Plugin พร้อมใช้งาน (รวมมาให้ในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอตและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงในทีม (หรือขอบเขตส่วนตัวสำหรับข้อความส่วนตัว)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) และเริ่ม gateway
6. gateway รับทราฟฟิก Bot Framework Webhook ที่ `/api/messages` ตามค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [สร้าง Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **พื้นฐาน**:

   | ฟิลด์              | ค่า                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือกการสมัครใช้งาน Azure ของคุณ                           |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่                               |
   | **Pricing tier**   | **ฟรี** สำหรับการพัฒนา/ทดสอบ                                 |
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
   - ใช้งานจริง: `https://your-domain.com/api/messages`
   - พัฒนาในเครื่อง: ใช้ทันเนล (ดู [การพัฒนาในเครื่อง](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้งานช่อง Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับข้อกำหนดในการให้บริการ

### ขั้นตอนที่ 5: สร้างแมนิเฟสต์แอป Teams

- รวมรายการ `bot` ที่มี `botId = <App ID>`
- ขอบเขต: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขตส่วนตัว)
- เพิ่มสิทธิ์ RSC (ดู [สิทธิ์ RSC](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- ซิปไฟล์ทั้งสามเข้าด้วยกัน: `manifest.json`, `outline.png`, `color.png`

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

ช่อง Teams จะเริ่มทำงานโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและมีค่ากำหนด `msteams` พร้อมข้อมูลประจำตัว

</details>

## การยืนยันตัวตนแบบ federated (ใบรับรองรวมกับ managed identity)

> เพิ่มใน 2026.4.11

สำหรับการดีพลอยใช้งานจริง OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่า client secret มีสองวิธีให้ใช้:

### ตัวเลือก A: การยืนยันตัวตนด้วยใบรับรอง

ใช้ใบรับรอง PEM ที่ลงทะเบียนกับ app registration ใน Entra ID ของคุณ

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

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน เหมาะสำหรับการดีพลอยบนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity พร้อมใช้งาน

**วิธีการทำงาน:**

1. พ็อด/VM ของบอตมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity เข้ากับ app registration ใน Entra ID
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับโทเค็นจาก Azure IMDS endpoint (`169.254.169.254`)
4. โทเค็นถูกส่งให้ Teams SDK สำหรับการยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- federated identity credential ที่สร้างบน app registration ใน Entra ID
- การเข้าถึงเครือข่ายไปยัง IMDS (`169.254.169.254:80`) จากพ็อด/VM

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

**การกำหนดค่า (ข้อมูลประจำตัวแบบมีการจัดการที่ผู้ใช้กำหนด):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะแบบผู้ใช้กำหนดเท่านั้น)

### การตั้งค่า AKS Workload Identity

สำหรับการปรับใช้ AKS ที่ใช้ Workload Identity:

1. **เปิดใช้ Workload Identity** บนคลัสเตอร์ AKS ของคุณ
2. **สร้างข้อมูลประจำตัวแบบสหพันธรัฐ** บนการลงทะเบียนแอป Entra ID:

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

4. **ติดป้ายกำกับพ็อด** สำหรับการฉีด Workload Identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้มีการเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) — หากใช้ NetworkPolicy ให้เพิ่มกฎขาออกที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธี | การกำหนดค่า | ข้อดี | ข้อเสีย |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **ความลับไคลเอนต์** | `appPassword` | ตั้งค่าง่าย | ต้องหมุนเวียนความลับ ปลอดภัยน้อยกว่า |
| **ใบรับรอง** | `authType: "federated"` + `certificatePath` | ไม่มีความลับที่ใช้ร่วมกันผ่านเครือข่าย | มีภาระในการจัดการใบรับรอง |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่าน ไม่มีความลับให้จัดการ | ต้องมีโครงสร้างพื้นฐาน Azure |

**พฤติกรรมเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้ค่าเริ่มต้นเป็นการยืนยันตัวตนด้วยความลับไคลเอนต์ การกำหนดค่าที่มีอยู่จะยังทำงานต่อไปโดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาภายในเครื่อง (การทำอุโมงค์)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้อุโมงค์สำหรับพัฒนาแบบคงอยู่เพื่อให้ URL ของคุณคงเดิมในทุกเซสชัน:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

ทางเลือก: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละเซสชัน)

หาก URL อุโมงค์ของคุณเปลี่ยน ให้อัปเดตปลายทาง:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## การทดสอบบอท

**เรียกใช้การวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียนบอท แอป AAD แมนิเฟสต์ และการกำหนดค่า SSO ในรอบเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ใช้ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหาบอทใน Teams แล้วส่ง DM
3. ตรวจสอบบันทึก Gateway สำหรับกิจกรรมขาเข้า

## ตัวแปรสภาพแวดล้อม

คีย์การกำหนดค่าทั้งหมดสามารถตั้งค่าผ่านตัวแปรสภาพแวดล้อมแทนได้:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (สหพันธรัฐ + ใบรับรอง)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `MSTEAMS_USE_MANAGED_IDENTITY` (สหพันธรัฐ + ข้อมูลประจำตัวแบบมีการจัดการ)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ MI แบบผู้ใช้กำหนดเท่านั้น)

## การกระทำข้อมูลสมาชิก

OpenClaw เปิดเผยการกระทำ `member-info` ที่รองรับโดย Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถแก้ไขรายละเอียดสมาชิกของช่อง (ชื่อที่แสดง อีเมล บทบาท) ได้โดยตรงจาก Microsoft Graph

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วในแมนิเฟสต์ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อมความยินยอมจากผู้ดูแลระบบ

การกระทำนี้ถูกควบคุมโดย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้เมื่อมีข้อมูลประจำตัว Graph)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความล่าสุดในช่อง/กลุ่มที่จะถูกห่อเข้าไปในพรอมป์
- ถอยกลับไปใช้ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้ (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองตามรายการอนุญาตผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการเติมบริบทเธรดจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่อ้างอิง (`ReplyTo*` ที่ได้มาจาก HTML การตอบกลับของ Teams) ปัจจุบันถูกส่งต่อตามที่ได้รับ
- กล่าวอีกอย่างหนึ่ง รายการอนุญาตควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ปัจจุบันมีเพียงเส้นทางบริบทเสริมบางเส้นทางเท่านั้นที่ถูกกรอง
- ประวัติ DM สามารถจำกัดได้ด้วย `channels.msteams.dmHistoryLimit` (เทิร์นของผู้ใช้) การแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ของ Teams ปัจจุบัน (แมนิเฟสต์)

เหล่านี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ในแมนิเฟสต์แอป Teams ของเรา สิทธิ์เหล่านี้ใช้ได้เฉพาะภายในทีม/แชทที่ติดตั้งแอปไว้เท่านั้น

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

## ตัวอย่างแมนิเฟสต์ Teams (ปกปิดข้อมูลแล้ว)

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

### ข้อควรระวังเกี่ยวกับแมนิเฟสต์ (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง** ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง** ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวมพื้นผิวที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- จำเป็นต้องมี `bots[].supportsFiles: true` สำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล
- `authorization.permissions.resourceSpecific` ต้องรวมการอ่าน/ส่งช่อง หากคุณต้องการทราฟฟิกช่อง

### การอัปเดตแอปที่มีอยู่

หากต้องการอัปเดตแอป Teams ที่ติดตั้งไว้แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

หลังอัปเดต ให้ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล และ **ออกจาก Teams อย่างสมบูรณ์แล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างเมทาดาทาของแอปที่แคชไว้

<details>
<summary>การอัปเดตแมนิเฟสต์ด้วยตนเอง (โดยไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัดแมนิเฟสต์ใหม่** พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **Teams Admin Center:** แอป Teams → จัดการแอป → ค้นหาแอปของคุณ → อัปโหลดเวอร์ชันใหม่
   - **Sideload:** ใน Teams → แอป → จัดการแอปของคุณ → อัปโหลดแอปแบบกำหนดเอง

</details>

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อใช้ **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว ไม่มีสิทธิ์ Graph API)

ทำงานได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความในช่อง
- ส่งเนื้อหา **ข้อความ** ของข้อความในช่อง
- รับไฟล์แนบของ **ส่วนบุคคล (DM)**

ทำงานไม่ได้:

- **เนื้อหารูปภาพหรือไฟล์** ในช่อง/กลุ่ม (เพย์โหลดมีเฉพาะโครง HTML)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจากเหตุการณ์ Webhook สด)

### เมื่อใช้ **Teams RSC + สิทธิ์ Microsoft Graph Application**

เพิ่ม:

- ดาวน์โหลดเนื้อหาที่โฮสต์ไว้ (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความช่อง/แชทผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ | สิทธิ์ RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์** | ใช่ (ผ่าน Webhook) | ไม่ (ทำได้เฉพาะการโพล) |
| **ข้อความย้อนหลัง** | ไม่ | ใช่ (สามารถค้นประวัติได้) |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะแมนิเฟสต์แอป | ต้องมีความยินยอมจากผู้ดูแลระบบ + โฟลว์โทเค็น |
| **ทำงานเมื่อออฟไลน์** | ไม่ (ต้องกำลังทำงานอยู่) | ใช่ (ค้นได้ทุกเวลา) |

**สรุป:** RSC มีไว้สำหรับการฟังแบบเรียลไทม์ ส่วน Graph API มีไว้สำหรับการเข้าถึงข้อมูลย้อนหลัง หากต้องการตามข้อความที่พลาดไปขณะออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมีความยินยอมจากผู้ดูแลระบบ)

## สื่อ + ประวัติที่เปิดใช้ Graph (จำเป็นสำหรับช่อง)

หากคุณต้องการรูปภาพ/ไฟล์ใน **ช่อง** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ความยินยอมจากผู้ดูแลระบบ

1. ใน **การลงทะเบียนแอป** Entra ID (Azure AD) ให้เพิ่ม **สิทธิ์ Application** ของ Microsoft Graph:
   - `ChannelMessage.Read.All` (ไฟล์แนบช่อง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชทกลุ่ม)
2. **ให้ความยินยอมจากผู้ดูแลระบบ** สำหรับผู้เช่า
3. เพิ่มค่า **เวอร์ชันแมนิเฟสต์** ของแอป Teams อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ออกจาก Teams อย่างสมบูรณ์แล้วเปิดใหม่** เพื่อล้างเมทาดาทาของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการกล่าวถึงผู้ใช้:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ในการสนทนา อย่างไรก็ตาม หากคุณต้องการค้นหาและกล่าวถึงผู้ใช้ที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** แบบไดนามิก ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมจากผู้ดูแลระบบ

## ข้อจำกัดที่ทราบ

### Webhook หมดเวลา

Teams ส่งข้อความผ่าน HTTP Webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับ LLM ช้า) คุณอาจพบ:

- Gateway หมดเวลา
- Teams ลองส่งข้อความซ้ำ (ทำให้เกิดข้อความซ้ำ)
- การตอบกลับถูกทิ้ง

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งคำตอบเชิงรุก แต่การตอบกลับที่ช้ามากยังอาจก่อให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการซ้อนกัน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบช่องทางที่ใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลรับรองของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: allowlist สำหรับ DM (แนะนำให้ใช้ AAD object IDs) ตัวช่วยตั้งค่าจะแปลงชื่อเป็น IDs ระหว่างการตั้งค่าเมื่อมีสิทธิ์เข้าถึง Graph
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้การจับคู่ UPN/ชื่อแสดงผลที่เปลี่ยนแปลงได้และการกำหนดเส้นทางชื่อทีม/ช่องทางโดยตรงอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดชิ้นข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแยกตามความยาว
- `channels.msteams.mediaAllowHosts`: allowlist สำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: allowlist สำหรับแนบส่วนหัว Authorization เมื่อ retry สื่อ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.requireMention`: ต้องมี @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การเขียนทับรายทีม
- `channels.msteams.teams.<teamId>.requireMention`: การเขียนทับรายทีม
- `channels.msteams.teams.<teamId>.tools`: การเขียนทับนโยบายเครื่องมือค่าเริ่มต้นรายทีม (`allow`/`deny`/`alsoAllow`) ที่ใช้เมื่อไม่มีการเขียนทับระดับช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: การเขียนทับนโยบายเครื่องมือตามผู้ส่งค่าเริ่มต้นรายทีม (รองรับ wildcard `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การเขียนทับรายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การเขียนทับรายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การเขียนทับนโยบายเครื่องมือรายช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การเขียนทับนโยบายเครื่องมือตามผู้ส่งรายช่องทาง (รองรับ wildcard `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปเป็น `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิด action ข้อมูลสมาชิกที่ใช้ Graph (ค่าเริ่มต้น: เปิดเมื่อมีข้อมูลรับรอง Graph)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน — `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (federated + certificate auth)
- `channels.msteams.certificateThumbprint`: thumbprint ของใบรับรอง (ไม่บังคับ, ไม่จำเป็นสำหรับ auth)
- `channels.msteams.useManagedIdentity`: เปิดใช้ managed identity auth (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ managed identity แบบ user-assigned
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชตกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบมาตรฐานของเอเจนต์ (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความโดยตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: threads เทียบกับโพสต์

Teams เพิ่งเพิ่มรูปแบบ UI ช่องทางสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                  | คำอธิบาย                                                | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **โพสต์** (แบบคลาสสิก)      | ข้อความแสดงเป็นการ์ดพร้อมคำตอบแบบ thread อยู่ด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **Threads** (คล้าย Slack) | ข้อความไหลเรียงตามลำดับ คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องทางใช้รูปแบบ UI แบบใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในช่องทางแบบ Threads → คำตอบจะแสดงซ้อนกันอย่างไม่เหมาะสม
- `top-level` ในช่องทางแบบโพสต์ → คำตอบจะแสดงเป็นโพสต์ระดับบนสุดแยกกัน แทนที่จะอยู่ใน thread

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

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DMs:** รูปภาพและไฟล์แนบทำงานผ่าน Teams bot file APIs
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในที่จัดเก็บ M365 (SharePoint/OneDrive) payload ของ Webhook มีเพียง HTML stub ไม่ใช่ bytes ของไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งที่เน้นไฟล์เป็นหลักอย่างชัดเจน ให้ใช้ `action=upload-file` พร้อม `media` / `filePath` / `path`; `message` ที่ไม่บังคับจะกลายเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` จะเขียนทับชื่อที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความช่องทางที่มีรูปภาพจะถูกรับเป็นข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
ตามค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจาก hostnames ของ Microsoft/Teams เท่านั้น เขียนทับด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตโฮสต์ใดก็ได้)
ส่วนหัว Authorization จะถูกแนบเฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework) เก็บรายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบหลาย tenant)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ใน DMs โดยใช้โฟลว์ FileConsentCard (มีในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่ต้องมี                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **แชตกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องมี `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | เข้ารหัส inline แบบ Base64                        | ใช้งานได้ทันที                            |

### เหตุผลที่แชตกลุ่มต้องใช้ SharePoint

บอตไม่มี OneDrive drive ส่วนตัว (endpoint `/me/drive` ของ Graph API ใช้ไม่ได้กับ application identities) เพื่อส่งไฟล์ในแชตกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **SharePoint site** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ, เปิดใช้ลิงก์แชร์รายผู้ใช้

2. **ให้ admin consent** สำหรับ tenant

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกแชตเข้าถึงได้)      |

การแชร์รายผู้ใช้ปลอดภัยกว่า เพราะมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback เป็นการแชร์ทั่วทั้งองค์กร

### พฤติกรรม fallback

| สถานการณ์                                          | ผลลัพธ์                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์            |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว), ส่งเฉพาะข้อความ |
| แชตส่วนตัว + ไฟล์                              | โฟลว์ FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint)    |
| ทุกบริบท + รูปภาพ                               | เข้ารหัส inline แบบ Base64 (ทำงานได้โดยไม่ต้องใช้ SharePoint)   |

### ตำแหน่งจัดเก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกจัดเก็บในโฟลเดอร์ `/OpenClawShared/` ในไลบรารีเอกสารค่าเริ่มต้นของ SharePoint site ที่กำหนดค่าไว้

## โพล (Adaptive Cards)

OpenClaw ส่งโพลของ Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบ native)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- คะแนนโหวตถูกบันทึกโดย Gateway ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลยังไม่โพสต์สรุปผลโดยอัตโนมัติ (ตรวจดูไฟล์ store หากจำเป็น)

## การ์ดการนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนา Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` แล้ว ข้อความของ message จะไม่บังคับ

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

Target ของ MSTeams ใช้คำนำหน้าเพื่อแยกระหว่างผู้ใช้และการสนทนา:

| ประเภท target         | รูปแบบ                           | ตัวอย่าง                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)      | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)              |
| กลุ่ม/ช่องทาง       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/ช่องทาง (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`) |

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
หากไม่มีคำนำหน้า `user:` ชื่อจะใช้ค่าเริ่มต้นเป็นการแก้ไขเป็นกลุ่มหรือทีม ใช้ `user:` เสมอเมื่อระบุเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกทำได้เฉพาะ **หลังจาก** ผู้ใช้มีการโต้ตอบแล้วเท่านั้น เพราะเราจะเก็บการอ้างอิงการสนทนาไว้ ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมด้วยรายการอนุญาต

## ID ของทีมและแชนเนล (จุดที่มักพลาด)

พารามิเตอร์คิวรี `groupId` ใน URL ของ Teams **ไม่ใช่** ID ทีมที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จากพาธของ URL แทน:

**URL ของทีม:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID การสนทนาของทีม (ถอดรหัส URL ค่านี้)
```

**URL ของแชนเนล:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID แชนเนล (ถอดรหัส URL ค่านี้)
```

**สำหรับ config:**

- คีย์ทีม = ส่วนพาธหลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`; tenant รุ่นเก่าอาจแสดง `@thread.skype` ซึ่งใช้ได้เช่นกัน)
- คีย์แชนเนล = ส่วนพาธหลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ละเว้น** พารามิเตอร์คิวรี `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw ค่านี้คือ ID กลุ่ม Microsoft Entra ไม่ใช่ ID การสนทนาของ Bot Framework ที่ใช้ในกิจกรรมขาเข้าของ Teams

## แชนเนลส่วนตัว

บอตรองรับแชนเนลส่วนตัวได้จำกัด:

| ฟีเจอร์                      | แชนเนลมาตรฐาน | แชนเนลส่วนตัว       |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอต             | ได้               | จำกัด                |
| ข้อความแบบเรียลไทม์ (Webhook) | ได้               | อาจไม่ทำงาน           |
| สิทธิ์ RSC              | ได้               | อาจทำงานต่างออกไป |
| @mentions                    | ได้               | หากเข้าถึงบอตได้   |
| ประวัติ Graph API            | ได้               | ได้ (เมื่อมีสิทธิ์) |

**วิธีแก้ปัญหาหากแชนเนลส่วนตัวใช้งานไม่ได้:**

1. ใช้แชนเนลมาตรฐานสำหรับการโต้ตอบกับบอต
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความถึงบอตได้โดยตรงเสมอ
3. ใช้ Graph API สำหรับการเข้าถึงประวัติ (ต้องมี `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในแชนเนล:** สิทธิ์ Graph หรือการยินยอมจากผู้ดูแลระบบหายไป ติดตั้งแอป Teams ใหม่ แล้วปิดและเปิด Teams ใหม่ทั้งหมด
- **ไม่มีการตอบกลับในแชนเนล:** โดยค่าเริ่มต้นต้องมีการ mention; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าตามทีม/แชนเนล
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบและเพิ่มแอปใหม่ แล้วปิด Teams ทั้งหมดเพื่อรีเฟรช
- **401 Unauthorized จาก Webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายความว่า endpoint เข้าถึงได้ แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ สร้างไอคอน PNG ที่ถูกต้อง (`outline.png` ขนาด 32x32, `color.png` ขนาด 192x192)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชทอื่น ให้ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การเปลี่ยนแปลงกระจายผล
- **"Something went wrong" ขณะอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบเนื้อหาการตอบกลับเพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" - วิธีนี้มักเลี่ยงข้อจำกัด sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตทุกตัวอักษร
2. อัปโหลดแอปใหม่และติดตั้งใหม่ในทีม/แชท
3. ตรวจสอบว่าผู้ดูแลระบบขององค์กรบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม, `ChatMessage.Read.Chat` สำหรับแชทกลุ่ม

## อ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมา manifest ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความแชนเนลด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [อ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอต Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (แชนเนล/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอต

## ที่เกี่ยวข้อง

- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
