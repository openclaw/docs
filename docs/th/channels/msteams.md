---
read_when:
    - การพัฒนาฟีเจอร์ของช่องทาง Microsoft Teams
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าบอต Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-19T06:56:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a4cf686da27e28b58f7afaad8cc837dbddb93219cde0c37285f9f6895f6fb8c
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความและไฟล์แนบใน DM แล้ว การส่งไฟล์ในช่อง/กลุ่มต้องใช้ `sharePointSiteId` พร้อมสิทธิ์ Graph (ดู [การส่งไฟล์ในการแชทกลุ่ม](#sending-files-in-group-chats)) แบบสำรวจจะส่งผ่าน Adaptive Cards การดำเนินการกับข้อความมี `upload-file` แบบชัดเจนสำหรับการส่งที่เริ่มด้วยไฟล์

## Plugin ที่รวมมาให้

Microsoft Teams จัดส่งเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน โดยไม่ต้องติดตั้งแยกต่างหากในการสร้างแพ็กเกจตามปกติ

สำหรับรุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้แพ็กเกจแบบไม่ระบุเวอร์ชันเพื่อติดตามแท็กรุ่นอย่างเป็นทางการปัจจุบัน ตรึงเวอร์ชันที่แน่นอนเฉพาะเมื่อต้องการการติดตั้งที่ทำซ้ำได้

เช็กเอาต์ในเครื่อง (เรียกใช้จากรีโพซิทอรี git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าด่วน

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอต การสร้างไฟล์ manifest และการสร้างข้อมูลประจำตัวได้ในคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # ตรวจสอบว่าคุณเข้าสู่ระบบแล้วและดูข้อมูล tenant ของคุณ
```

<Note>
ขณะนี้ Teams CLI ยังอยู่ในช่วงพรีวิว คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างแต่ละรุ่น
</Note>

**2. เริ่มต้นทันเนล** (Teams ไม่สามารถเข้าถึง localhost ได้)

ติดตั้งและยืนยันตัวตนกับ devtunnel CLI หากจำเป็น ([คู่มือเริ่มต้นใช้งาน](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started))

```bash
# ตั้งค่าครั้งเดียว (URL คงเดิมในทุกเซสชัน):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# ในแต่ละเซสชันการพัฒนา:
devtunnel host my-openclaw-bot
# เอนด์พอยต์ของคุณ: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
จำเป็นต้องใช้ `--allow-anonymous` เนื่องจาก Teams ไม่สามารถยืนยันตัวตนกับ devtunnels ได้ แต่ละคำขอบอตขาเข้ายังคงได้รับการตรวจสอบโดย Teams SDK
</Note>

ทางเลือก: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละเซสชัน)

**3. สร้างแอป**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

คำสั่งนี้จะสร้างแอปพลิเคชัน Entra ID (Azure AD), สร้างข้อมูลลับของไคลเอนต์, สร้างและอัปโหลดไฟล์ manifest ของแอป Teams (พร้อมไอคอน) และลงทะเบียนบอตที่ Teams จัดการให้ (ไม่ต้องใช้การสมัครใช้งาน Azure) เอาต์พุตประกอบด้วย `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** พร้อมทั้งเสนอให้ติดตั้งแอปใน Teams โดยตรง

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

`teams app create` จะแจ้งให้ติดตั้งแอป ให้เลือก "Install in Teams" หากต้องการรับลิงก์ติดตั้งในภายหลัง:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงานได้**

```bash
teams app doctor <teamsAppId>
```

เรียกใช้การวินิจฉัยครอบคลุมการลงทะเบียนบอต การกำหนดค่าแอป AAD ความถูกต้องของไฟล์ manifest และการตั้งค่า SSO

สำหรับการใช้งานจริง ควรพิจารณาใช้ [การยืนยันตัวตนแบบสหพันธรัฐ](#federated-authentication-certificate-plus-managed-identity) (ใบรับรองหรือข้อมูลประจำตัวที่มีการจัดการ) แทนข้อมูลลับของไคลเอนต์

<Note>
การแชทกลุ่มถูกบล็อกโดยค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (ยังต้องมีการกล่าวถึง)
</Note>

## เป้าหมาย

- สนทนากับ OpenClaw ผ่าน DM การแชทกลุ่ม หรือช่องของ Teams
- รักษาการกำหนดเส้นทางให้แน่นอน: การตอบกลับจะย้อนกลับไปยังช่องที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมช่องที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องกล่าวถึง เว้นแต่กำหนดค่าไว้เป็นอย่างอื่น)

## การเขียนค่ากำหนด

โดยค่าเริ่มต้น Microsoft Teams สามารถเขียนการอัปเดตค่ากำหนดที่เรียกใช้โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ ID อ็อบเจ็กต์ AAD ที่คงที่หรือกลุ่มสิทธิ์เข้าถึงของผู้ส่งแบบคงที่ เช่น `accessGroup:core-team`
- อย่าอาศัยการจับคู่ UPN/ชื่อที่แสดงสำหรับรายการอนุญาต เนื่องจากค่าเหล่านี้เปลี่ยนแปลงได้ OpenClaw ปิดใช้งานการจับคู่ชื่อโดยตรงเป็นค่าเริ่มต้น หากต้องการใช้ ให้เปิดด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- วิซาร์ดสามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลประจำตัวมีสิทธิ์เพียงพอ

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อกจนกว่าจะเพิ่ม `groupAllowFrom`) `channels.defaults.groupPolicy` สามารถแทนที่ค่าเริ่มต้นที่ใช้ร่วมกันเมื่อไม่ได้ตั้งค่า `channels.msteams.groupPolicy`
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งหรือกลุ่มสิทธิ์เข้าถึงของผู้ส่งแบบคงที่ใดสามารถเรียกใช้ในการแชทกลุ่ม/ช่องได้ (หากไม่มีจะใช้ `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (โดยค่าเริ่มต้นยังคงต้องมีการกล่าวถึง)
- หากต้องการบล็อกช่อง **ทั้งหมด** ให้ตั้งค่า `channels.msteams.groupPolicy: "disabled"`

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

**รายการอนุญาตของทีม + ช่อง**

- จำกัดขอบเขตการตอบกลับในกลุ่ม/ช่องโดยระบุทีมและช่องภายใต้ `channels.msteams.teams`
- ใช้ ID การสนทนา Teams ที่คงที่จากลิงก์ Teams เป็นคีย์ ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ (ดู [ID ทีมและช่อง](#team-and-channel-ids-common-gotcha))
- เมื่อมี `groupPolicy="allowlist"` และรายการอนุญาตของทีม ระบบจะยอมรับเฉพาะทีม/ช่องที่ระบุไว้เท่านั้น (ต้องมีการกล่าวถึง)
- วิซาร์ดกำหนดค่ายอมรับรายการ `Team/Channel` และจัดเก็บให้
- เมื่อเริ่มต้น OpenClaw จะแปลงชื่อทีม/ช่องและชื่อในรายการอนุญาตของผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต) และบันทึกการจับคู่ลงในล็อก ชื่อที่แปลงไม่ได้จะถูกเก็บไว้ตามที่ป้อน แต่จะถูกเพิกเฉยในการกำหนดเส้นทาง เว้นแต่ตั้งค่า `channels.msteams.dangerouslyAllowNameMatching: true`

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

### วิธีการทำงาน

1. ตรวจสอบว่า Plugin Microsoft Teams พร้อมใช้งาน (รวมมาให้ในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + ข้อมูลลับ + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอต รวมถึงสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงในทีม (หรือขอบเขตส่วนบุคคลสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) และเริ่ม Gateway
6. โดยค่าเริ่มต้น Gateway จะรอรับทราฟฟิก Webhook ของ Bot Framework ที่ `/api/messages`

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | ฟิลด์              | ค่า                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือกการสมัครใช้งาน Azure ของคุณ                           |
   | **Resource group** | สร้างใหม่หรือใช้รายการที่มีอยู่                               |
   | **Pricing tier**   | **Free** สำหรับการพัฒนา/ทดสอบ                                 |
   | **Type of App**    | **Single Tenant** (แนะนำ โปรดดูหมายเหตุด้านล่าง)          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
การสร้างบอตแบบหลาย tenant ใหม่ถูกเลิกใช้หลังวันที่ 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่
</Warning>

3. คลิก **Review + create** แล้วคลิก **Create** (ประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลประจำตัว

1. ทรัพยากร Azure Bot → **Configuration** → คัดลอก **Microsoft App ID** (`appId` ของคุณ)
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → คัดลอก **Value** (`appPassword` ของคุณ)
3. **Overview** → คัดลอก **Directory (tenant) ID** (`tenantId` ของคุณ)

### ขั้นตอนที่ 3: กำหนดค่าเอนด์พอยต์การส่งข้อความ

1. Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint**:
   - การใช้งานจริง: `https://your-domain.com/api/messages`
   - การพัฒนาในเครื่อง: ใช้ทันเนล (ดู [การพัฒนาในเครื่อง](#local-development-tunneling))

### ขั้นตอนที่ 4: เปิดใช้งานช่อง Teams

1. Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

### ขั้นตอนที่ 5: สร้างไฟล์ manifest ของแอป Teams

- ใส่รายการ `bot` พร้อม `botId = <App ID>`
- ขอบเขต: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล)
- เพิ่มสิทธิ์ RSC (ดู [สิทธิ์ RSC](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- บีบอัด `manifest.json`, `outline.png` และ `color.png` รวมกันเป็นไฟล์ Zip

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

### ขั้นตอนที่ 7: เรียกใช้ Gateway

ช่อง Teams จะเริ่มโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและค่ากำหนด `msteams` มีข้อมูลประจำตัว

</details>

## การยืนยันตัวตนแบบสหพันธรัฐ (ใบรับรองร่วมกับข้อมูลประจำตัวที่มีการจัดการ)

สำหรับการใช้งานจริง OpenClaw รองรับ **การยืนยันตัวตนแบบสหพันธรัฐ** ผ่าน `channels.msteams.authType: "federated"` เพื่อเป็นทางเลือกแทนข้อมูลลับของไคลเอนต์ โดยมีสองวิธี:

### ตัวเลือก A: การยืนยันตัวตนด้วยใบรับรอง

ใช้ใบรับรอง PEM ที่ลงทะเบียนกับการลงทะเบียนแอป Entra ID

**การตั้งค่า:**

1. สร้างหรือรับใบรับรอง (รูปแบบ PEM พร้อมคีย์ส่วนตัว)
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → อัปโหลดใบรับรองสาธารณะ

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

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนโดยไม่ใช้รหัสผ่านบนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs)

**วิธีการทำงาน:**

1. พ็อด/VM ของบอตมีข้อมูลประจำตัวที่มีการจัดการ (กำหนดโดยระบบหรือกำหนดโดยผู้ใช้)
2. ข้อมูลประจำตัวแบบสหพันธรัฐเชื่อมโยงข้อมูลประจำตัวที่มีการจัดการเข้ากับการลงทะเบียนแอป Entra ID
3. ขณะรัน OpenClaw ใช้ `@azure/identity` เพื่อรับโทเค็นจากเอนด์พอยต์ Azure IMDS
4. โทเค็นจะถูกส่งไปยัง Teams SDK เพื่อยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้งานข้อมูลประจำตัวที่มีการจัดการ (ข้อมูลประจำตัวของเวิร์กโหลด AKS, App Service, VM)
- สร้างข้อมูลประจำตัวแบบสหพันธรัฐในการลงทะเบียนแอป Entra ID แล้ว
- การเข้าถึง IMDS (`169.254.169.254:80`) ผ่านเครือข่ายจากพ็อด/VM

**การกำหนดค่า (ข้อมูลประจำตัวที่มีการจัดการซึ่งระบบกำหนด):**

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

**การกำหนดค่า (ข้อมูลประจำตัวที่มีการจัดการซึ่งผู้ใช้กำหนด):** เพิ่ม `managedIdentityClientId: "<MI_CLIENT_ID>"` ลงในบล็อกด้านบน

**ตัวแปรสภาพแวดล้อม:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะแบบที่ผู้ใช้กำหนด)

### การตั้งค่าข้อมูลประจำตัวของเวิร์กโหลด AKS

สำหรับการปรับใช้ AKS ที่ใช้ข้อมูลประจำตัวของเวิร์กโหลด:

1. **เปิดใช้งานข้อมูลประจำตัวของเวิร์กโหลด** บนคลัสเตอร์ AKS
2. **สร้างข้อมูลประจำตัวแบบสหพันธรัฐ** ในการลงทะเบียนแอป Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **เพิ่มคำอธิบายประกอบให้บัญชีบริการ Kubernetes** ด้วย ID ไคลเอนต์ของแอป:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **เพิ่มป้ายกำกับให้พ็อด** เพื่อแทรกข้อมูลประจำตัวของเวิร์กโหลด:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **อนุญาตการเข้าถึงผ่านเครือข่าย** ไปยัง IMDS (`169.254.169.254`): หากใช้ NetworkPolicy ให้เพิ่มกฎขาออกสำหรับ `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธีการ               | การกำหนดค่า                                         | ข้อดี                               | ข้อเสีย                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **ข้อมูลลับไคลเอนต์**    | `appPassword`                                  | ตั้งค่าได้ง่าย                       | ต้องหมุนเวียนข้อมูลลับและมีความปลอดภัยน้อยกว่า |
| **ใบรับรอง**      | `authType: "federated"` + `certificatePath`    | ไม่มีข้อมูลลับที่ใช้ร่วมกันส่งผ่านเครือข่าย      | มีภาระในการจัดการใบรับรอง       |
| **ข้อมูลประจำตัวที่มีการจัดการ** | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่านและไม่มีข้อมูลลับที่ต้องจัดการ | ต้องมีโครงสร้างพื้นฐาน Azure         |

สามารถตั้งค่า `certificateThumbprint` ร่วมกับ `certificatePath` ได้ แต่เส้นทางการยืนยันตัวตนยังไม่อ่านค่านี้ในปัจจุบัน โดยยอมรับไว้เพื่อความเข้ากันได้ในอนาคตเท่านั้น

**ค่าเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนด้วยข้อมูลลับไคลเอนต์ (`appPassword`) การกำหนดค่าที่มีอยู่จะยังคงทำงานได้โดยไม่เปลี่ยนแปลง

## การพัฒนาในเครื่อง (การทำทันเนล)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ทันเนลสำหรับการพัฒนาแบบถาวรเพื่อให้ URL คงที่ระหว่างเซสชัน:

```bash
# ตั้งค่าครั้งเดียว:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# แต่ละเซสชันการพัฒนา:
devtunnel host my-openclaw-bot
```

ทางเลือก: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนในแต่ละเซสชัน)

หาก URL ของทันเนลเปลี่ยนแปลง ให้อัปเดตปลายทาง:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## การทดสอบบอต

**เรียกใช้การวินิจฉัย:**

```bash
teams app doctor <teamsAppId>
```

ตรวจสอบการลงทะเบียนบอต แอป AAD ไฟล์ manifest และการกำหนดค่า SSO ในครั้งเดียว

**ส่งข้อความทดสอบ:**

1. ติดตั้งแอป Teams (ลิงก์ติดตั้งจาก `teams app get <id> --install-link`)
2. ค้นหาบอตใน Teams แล้วส่ง DM
3. ตรวจสอบบันทึกของ Gateway เพื่อดูกิจกรรมขาเข้า

## ตัวแปรสภาพแวดล้อม

คีย์การกำหนดค่าที่เกี่ยวข้องกับการยืนยันตัวตนเหล่านี้สามารถตั้งค่าผ่านตัวแปรสภาพแวดล้อมแทน `openclaw.json` ได้ (คีย์การกำหนดค่าอื่น เช่น `groupPolicy` หรือ `historyLimit` ตั้งค่าได้ผ่านไฟล์กำหนดค่าเท่านั้น):

| ตัวแปรสภาพแวดล้อม                              | คีย์การกำหนดค่า                | หมายเหตุ                               |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` หรือ `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | แบบสหพันธรัฐ + ใบรับรอง             |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | ยอมรับได้ แต่ไม่จำเป็นสำหรับการยืนยันตัวตน     |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | แบบสหพันธรัฐ + ข้อมูลประจำตัวที่มีการจัดการ        |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | เฉพาะข้อมูลประจำตัวที่มีการจัดการซึ่งผู้ใช้กำหนด |

## การดำเนินการข้อมูลสมาชิก

OpenClaw มีการดำเนินการ `member-info` ที่รองรับโดย Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถค้นหารายละเอียดรายชื่อสมาชิกที่ผ่านการตรวจสอบแล้วสำหรับการสนทนาที่กำหนดค่าไว้

ข้อกำหนด:

- สิทธิ์ RSC `ChannelSettings.Read.Group` และ `TeamMember.Read.Group` (รวมอยู่ในไฟล์ manifest ที่แนะนำแล้ว)

การดำเนินการนี้พร้อมใช้งานทุกครั้งที่กำหนดค่าข้อมูลประจำตัว Graph โดยไม่มีตัวเลือก `channels.msteams.actions.memberInfo` แยกต่างหาก
การค้นหาช่องมาตรฐานจะส่งคืนข้อมูลประจำตัวจากรายชื่อสมาชิกทีมที่ตรงกัน ชื่อที่แสดง อีเมล และบทบาท
ในการสนทนาส่วนตัวหรือแชทกลุ่มปัจจุบัน การดำเนินการนี้สามารถส่งคืน ID ผู้ใช้แบบคงที่ของผู้ส่งที่เชื่อถือได้
การค้นหาสมาชิกในช่องส่วนตัว/ช่องที่แชร์และแชทที่ไม่ใช่แชทปัจจุบันต้องใช้สิทธิ์เข้าถึงรายชื่อสมาชิกเพิ่มเติม
และจะถูกปฏิเสธโดยเกณฑ์สิทธิ์เริ่มต้น

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความล่าสุดในช่อง/กลุ่มที่จะถูกรวมไว้ในพรอมต์ หากไม่มีค่าจะใช้ `messages.groupChat.historyLimit` และจากนั้นใช้ค่าเริ่มต้นเป็น 50 ตั้งค่า `0` เพื่อปิดใช้งาน
- ประวัติเธรดที่ดึงมาจะถูกกรองตามรายการผู้ส่งที่อนุญาต (`allowFrom` / `groupAllowFrom`) ดังนั้นการป้อนบริบทเริ่มต้นจากเธรดจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่ยกมา (แยกวิเคราะห์จาก HTML ตามสคีมา Skype Reply ในไฟล์แนบของข้อความตอบกลับเอง) จะถูกส่งผ่านโดยไม่กรอง ปัจจุบันมีเพียงการป้อนบริบทเริ่มต้นจากประวัติเธรดเท่านั้นที่ใช้ตัวกรองรายการผู้ส่งที่อนุญาต
- สามารถจำกัดประวัติ DM ด้วย `channels.msteams.dmHistoryLimit` (จำนวนรอบข้อความของผู้ใช้) การกำหนดค่าแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ปัจจุบันของ Teams (manifest)

รายการเหล่านี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ในไฟล์ manifest ของแอป Teams โดยมีผลเฉพาะภายในทีม/แชทที่ติดตั้งแอปเท่านั้น

**สำหรับช่อง (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความในช่องทั้งหมดโดยไม่ต้อง @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับแชทกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความแชทกลุ่มทั้งหมดโดยไม่ต้อง @mention

เพิ่มสิทธิ์ RSC ผ่าน Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## ตัวอย่างไฟล์ manifest ของ Teams (ปกปิดข้อมูลแล้ว)

ตัวอย่างขั้นต่ำที่ถูกต้องพร้อมฟิลด์ที่จำเป็น ให้แทนที่ ID และ URL

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
- `bots[].scopes` ต้องรวมพื้นผิวที่วางแผนจะใช้ (`personal`, `team`, `groupChat`)
- ต้องมี `bots[].supportsFiles: true` สำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล
- `authorization.permissions.resourceSpecific` ต้องรวมสิทธิ์อ่าน/ส่งข้อความในช่องสำหรับทราฟฟิกของช่อง

### การอัปเดตแอปที่มีอยู่

```bash
# ดาวน์โหลด แก้ไข และอัปโหลดไฟล์ manifest อีกครั้ง
teams app manifest download <teamsAppId> manifest.json
# แก้ไข manifest.json ในเครื่อง...
teams app manifest upload manifest.json <teamsAppId>
# ระบบจะเพิ่มเวอร์ชันโดยอัตโนมัติหากเนื้อหาเปลี่ยนแปลง
```

หลังจากอัปเดต ให้ติดตั้งแอปใหม่ในแต่ละทีม และ **ออกจาก Teams โดยสมบูรณ์แล้วเปิดใหม่** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

<details>
<summary>อัปเดตไฟล์ manifest ด้วยตนเอง (โดยไม่ใช้ CLI)</summary>

1. อัปเดต `manifest.json` ด้วยการตั้งค่าใหม่
2. **เพิ่มค่าฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัดไฟล์เป็น zip ใหม่** พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลดไฟล์ zip ใหม่:
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app

</details>

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อใช้ **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว แต่ไม่มีสิทธิ์ Graph API)

ใช้งานได้:

- อ่านเนื้อหา **ข้อความ** ในช่อง
- ส่งเนื้อหา **ข้อความ** ไปยังช่อง
- รับไฟล์แนบใน **การสนทนาส่วนตัว (DM)**

ใช้งานไม่ได้:

- **เนื้อหารูปภาพหรือไฟล์** ในช่อง/กลุ่ม (เพย์โหลดมีเพียงโครง HTML)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความนอกเหนือจากเหตุการณ์ Webhook สด

### เมื่อใช้ **Teams RSC + สิทธิ์ Application ของ Microsoft Graph**

เพิ่มความสามารถดังนี้:

- ดาวน์โหลดเนื้อหาที่โฮสต์ไว้ (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความในช่อง/แชทผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ                 | สิทธิ์ RSC                  | Graph API                                  |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์**       | ได้ (ผ่าน webhook)          | ไม่ได้ (ทำได้เฉพาะการโพล)                     |
| **ข้อความย้อนหลัง**           | ไม่ได้                       | ได้ (สามารถสืบค้นประวัติได้)                    |
| **ความซับซ้อนในการตั้งค่า**     | ใช้เฉพาะไฟล์ manifest ของแอป | ต้องได้รับความยินยอมจากผู้ดูแลระบบ + ขั้นตอนโทเค็น |
| **ทำงานขณะออฟไลน์**          | ไม่ได้ (ต้องทำงานอยู่)        | ได้ (สืบค้นได้ทุกเมื่อ)                        |

**สรุป:** RSC ใช้สำหรับรับฟังแบบเรียลไทม์ ส่วน Graph API ใช้สำหรับเข้าถึงข้อมูลย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไปขณะออฟไลน์ ต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องได้รับความยินยอมจากผู้ดูแลระบบ)

## สื่อและประวัติที่เปิดใช้ Graph

เปิดใช้เฉพาะสิทธิ์ระดับแอปพลิเคชันของ Microsoft Graph ที่จำเป็นสำหรับขอบเขตและข้อมูล Teams ที่ใช้:

1. Entra ID (Azure AD) **App Registration** → เพิ่ม Graph **Application permissions**:
   - `ChannelMessage.Read.All` สำหรับไฟล์แนบของช่องและประวัติช่อง
   - `Chat.Read.All` สำหรับไฟล์แนบของแชทกลุ่มและประวัติแชทกลุ่ม
   - `Files.Read.All` เมื่อต้องดาวน์โหลดไบต์ของไฟล์แนบจากพื้นที่จัดเก็บ SharePoint/OneDrive การตั้งค่าที่ใช้เฉพาะประวัติไม่จำเป็นต้องใช้สิทธิ์นี้
2. **Grant admin consent** สำหรับผู้เช่า
3. เพิ่ม **manifest version** ของแอป Teams อัปโหลดอีกครั้ง และ **ติดตั้งแอปใน Teams ใหม่**
4. **ปิด Teams โดยสมบูรณ์แล้วเปิดใหม่** เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

### การกู้คืนไฟล์ของช่อง/กลุ่ม (`graphMediaFallback`)

Teams อาจนำเครื่องหมายกำกับไฟล์ออกจากกิจกรรม HTML ที่ส่งไปยังบอต ในกรณีดังกล่าว กิจกรรม Bot Framework จะไม่สามารถแยกแยะจากข้อความ HTML ทั่วไปได้ โดยการอ้างอิงไฟล์แนบที่สมบูรณ์จะมีอยู่เฉพาะในสำเนาข้อความบน Graph เท่านั้น

เปิดใช้ทางเลือกสำรองหลังจากให้สิทธิ์ข้างต้นแล้ว:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

การตั้งค่านี้ใช้กับช่องและแชทกลุ่มเท่านั้น โดยจะเพิ่มการค้นหาข้อความผ่าน Graph หนึ่งครั้งเมื่อกิจกรรม HTML ไม่มีสื่อที่ดาวน์โหลดได้โดยตรง รวมถึงข้อความทั่วไปหรือข้อความที่มีเพียงการกล่าวถึง ค่าเริ่มต้นคือ `false` เพื่อไม่ให้การติดตั้งที่มีอยู่ได้รับทราฟฟิก Graph เพิ่มเติมหรือข้อผิดพลาดด้านสิทธิ์โดยอัตโนมัติ

**การกล่าวถึงผู้ใช้:** @mentions ใช้งานได้ทันทีสำหรับผู้ใช้ที่อยู่ในการสนทนาแล้ว หากต้องการค้นหาและกล่าวถึงผู้ใช้แบบไดนามิกซึ่ง **ไม่ได้อยู่ในการสนทนาปัจจุบัน** ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมจากผู้ดูแลระบบ

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน Webhook HTTP โดย OpenClaw ใช้ค่าหมดเวลาของเซิร์ฟเวอร์ HTTP
แบบคงที่กับตัวรับฟัง Webhook ดังกล่าว ได้แก่ ไม่มีการใช้งาน 30 วินาที คำขอทั้งหมด 30 วินาที และ 15 วินาที
สำหรับรับส่วนหัว สื่อขาเข้าและการเสริมบริบทที่เป็นทางเลือกใช้กรอบเวลาร่วมกัน
10 วินาที SDK จะตอบกลับหลังจากผนวกกิจกรรมดิบลงในพื้นที่จัดเก็บแบบคงทนแล้ว
การดำเนินรอบของเอเจนต์จะประมวลผลแยกต่างหากและตอบกลับเชิงรุก หากการจัดการ
คำขอหรือการรับเข้าแบบคงทนไม่ทันกรอบเวลาของการรับส่ง Teams อาจลองส่ง
กิจกรรมอีกครั้ง และ tombstone ขาเข้าจะปฏิเสธ ID เหตุการณ์ที่ซ้ำกัน

### การรองรับคลาวด์ Teams และ URL บริการ

เส้นทาง Teams ที่ใช้ SDK นี้ผ่านการตรวจสอบแบบใช้งานจริงสำหรับคลาวด์สาธารณะของ Microsoft Teams

การตอบกลับขาเข้าใช้บริบทของรอบ Teams SDK จากกิจกรรมขาเข้า การดำเนินการเชิงรุกนอกบริบท เช่น การส่ง แก้ไข ลบ การ์ด แบบสำรวจ ข้อความขอความยินยอมเกี่ยวกับไฟล์ และการตอบกลับที่ใช้เวลานานในคิว จะใช้ข้อมูลอ้างอิงการสนทนา `serviceUrl` ที่จัดเก็บไว้ คลาวด์สาธารณะใช้สภาพแวดล้อมคลาวด์สาธารณะของ Teams SDK เป็นค่าเริ่มต้น และอนุญาตข้อมูลอ้างอิงที่จัดเก็บไว้บนโฮสต์ Teams Connector สาธารณะ: `https://smba.trafficmanager.net/`

คลาวด์สาธารณะเป็นค่าเริ่มต้น ไม่จำเป็นต้องตั้งค่า `channels.msteams.cloud` หรือ `channels.msteams.serviceUrl` สำหรับบอตบนคลาวด์สาธารณะตามปกติ

สำหรับคลาวด์ Teams ที่ไม่ใช่สาธารณะ ให้ตั้งค่า `cloud` และขอบเขตเชิงรุกที่ตรงกันเมื่อ Microsoft เผยแพร่:

- `channels.msteams.cloud` เลือกค่าที่กำหนดไว้ล่วงหน้าสำหรับคลาวด์ Teams SDK เพื่อใช้กับการยืนยันตัวตน การตรวจสอบ JWT บริการโทเค็น และขอบเขต Graph
- `channels.msteams.serviceUrl` เลือกขอบเขตปลายทาง Bot Connector ที่ใช้ตรวจสอบข้อมูลอ้างอิงการสนทนาที่จัดเก็บไว้ก่อนการส่ง แก้ไข ลบ การ์ด แบบสำรวจ ข้อความขอความยินยอมเกี่ยวกับไฟล์ และการตอบกลับที่ใช้เวลานานในคิวแบบเชิงรุก ค่านี้จำเป็นสำหรับคลาวด์ SDK แบบ USGov และ DoD สำหรับ China/21Vianet นั้น OpenClaw ใช้ค่าที่กำหนดไว้ล่วงหน้า `China` ของ SDK และยอมรับ URL บริการที่จัดเก็บหรือกำหนดค่าไว้เฉพาะบนโฮสต์ช่องทาง Azure China Bot Framework

Microsoft เผยแพร่ปลายทาง Bot Connector เชิงรุกแบบส่วนกลางในส่วน [สร้างการสนทนา](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) ของเอกสารการส่งข้อความเชิงรุกของ Teams ใช้ `serviceUrl` ของกิจกรรมขาเข้าเมื่อมี มิฉะนั้นให้ใช้ตารางของ Microsoft ด้านล่าง

| สภาพแวดล้อม Teams | การกำหนดค่า OpenClaw                                             | `serviceUrl` เชิงรุก                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| สาธารณะ            | ไม่ต้องกำหนดค่า cloud/serviceUrl                            | `https://smba.trafficmanager.net/teams`            |
| GCC               | ตั้งค่า `serviceUrl`; ไม่มีค่าที่กำหนดไว้ล่วงหน้าสำหรับคลาวด์ Teams SDK แยกต่างหาก | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | ใช้ `serviceUrl` ของกิจกรรมขาเข้า           |

ตัวอย่างสำหรับ GCC ซึ่ง Microsoft ระบุ URL บริการเชิงรุกแยกต่างหาก แต่ Teams SDK ไม่มีค่าที่กำหนดไว้ล่วงหน้าสำหรับคลาวด์ GCC แยกต่างหาก:

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

`channels.msteams.serviceUrl` จำกัดให้ใช้เฉพาะโฮสต์ Microsoft Teams Bot Connector ที่รองรับ เมื่อกำหนดค่า URL บริการ OpenClaw จะตรวจสอบว่า `serviceUrl` ของการสนทนาที่จัดเก็บไว้ใช้โฮสต์เดียวกัน ก่อนดำเนินการส่ง แก้ไข ลบ การ์ด แบบสำรวจ หรือการตอบกลับที่ใช้เวลานานในคิวแบบเชิงรุก เมื่อใช้การกำหนดค่าคลาวด์สาธารณะเริ่มต้น OpenClaw จะปฏิเสธโดยค่าเริ่มต้นหากการสนทนาที่จัดเก็บไว้ชี้ไปยังปลายทางนอกโฮสต์ Teams Connector สาธารณะ หลังจากเปลี่ยนการตั้งค่าคลาวด์/URL บริการ ให้รับข้อความใหม่จากการสนทนาเพื่อให้ข้อมูลอ้างอิงการสนทนาที่จัดเก็บไว้เป็นปัจจุบัน

China/21Vianet ไม่มี URL `smba` เชิงรุกแบบส่วนกลางแยกต่างหากในตารางปลายทางเชิงรุกของ Teams จาก Microsoft กำหนดค่า `cloud: "China"` เพื่อให้ Teams SDK ใช้ปลายทางการยืนยันตัวตน โทเค็น และ JWT ของ Azure China จากนั้นการส่งเชิงรุกจะต้องใช้ข้อมูลอ้างอิงการสนทนาที่จัดเก็บไว้จากกิจกรรม China Teams ขาเข้า หรือ URL บริการที่กำหนดค่าไว้อย่างชัดเจน บนขอบเขตช่องทาง Azure China Bot Framework (`*.botframework.azure.cn`) ตัวช่วย Teams ที่ใช้ Graph จะถูกปิดใช้งานสำหรับ `cloud: "China"` จนกว่า OpenClaw จะกำหนดเส้นทางคำขอ Graph ผ่านปลายทาง Azure China Graph

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- รองรับการจัดรูปแบบพื้นฐาน: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับแบบสำรวจและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดูรูปแบบช่องทางที่ใช้ร่วมกันได้ที่ [/gateway/configuration](/th/gateway/configuration)):

- `channels.msteams.enabled`: เปิด/ปิดใช้งานช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลประจำตัวของบอต
- `channels.msteams.cloud`: สภาพแวดล้อมคลาวด์ของ Teams SDK (`Public`, `USGov`, `USGovDoD` หรือ `China`; ค่าเริ่มต้น `Public`) ตั้งค่าด้วย `serviceUrl` สำหรับคลาวด์ SDK ของ USGov/DoD ส่วนจีนใช้ค่าที่กำหนดไว้ล่วงหน้าของ SDK และการอ้างอิงการสนทนา Azure China Bot Framework ที่จัดเก็บไว้ โดยปิดใช้ตัวช่วยที่อาศัย Graph จนกว่าจะมีการจัดส่งการกำหนดเส้นทาง Azure China Graph
- `channels.msteams.serviceUrl`: ขอบเขต URL ของบริการ Bot Connector สำหรับการดำเนินการเชิงรุกของ SDK คลาวด์สาธารณะใช้ค่าเริ่มต้นของ SDK; ให้ตั้งค่าสำหรับ GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High หรือ DoD จีนรองรับโฮสต์ช่องทาง Azure China Bot Framework เมื่อการอ้างอิงการสนทนาที่จัดเก็บไว้มาจาก Teams ที่ดำเนินการโดย 21Vianet
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น `pairing`)
- `channels.msteams.allowFrom`: รายการอนุญาตสำหรับ DM (แนะนำให้ใช้ ID ออบเจ็กต์ AAD) ตัวช่วยตั้งค่าจะแปลงชื่อเป็น ID ระหว่างการตั้งค่าเมื่อสามารถเข้าถึง Graph ได้
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้การจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางโดยตรงด้วยชื่อทีม/ช่องทางอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดส่วนข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น `4000` และจำกัดสูงสุดแบบตายตัวที่ `4000` ไม่ว่าค่าที่กำหนดไว้จะสูงกว่านี้ก็ตาม)
- `channels.msteams.streaming.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตรงบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.msteams.mediaAllowHosts`: รายการอนุญาตสำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams ได้แก่ Graph, SharePoint/OneDrive, Teams CDN, Bot Framework และ Azure Media Services)
- `channels.msteams.mediaAuthAllowHosts`: รายการอนุญาตสำหรับแนบส่วนหัว Authorization เมื่อพยายามเรียกสื่อซ้ำ (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework)
- `channels.msteams.graphMediaFallback`: เลือกใช้การค้นหาข้อความผ่าน Graph เมื่อ HTML ของช่องทาง/กลุ่มไม่มีเครื่องหมายไฟล์ (ค่าเริ่มต้น `false`; ดู [การกู้คืนไฟล์ของช่องทาง/กลุ่ม](#channelgroup-file-recovery-graphmediafallback))
- `channels.msteams.mediaMaxMb`: ค่าจำกัดขนาดสื่อเฉพาะช่องทางเป็น MB หากไม่ได้ตั้งค่า จะใช้ `agents.defaults.mediaMaxMb`
- `channels.msteams.requireMention`: กำหนดให้ต้อง @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้น `true`)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: ค่าแทนที่เฉพาะทีม
- `channels.msteams.teams.<teamId>.requireMention`: ค่าแทนที่เฉพาะทีม
- `channels.msteams.teams.<teamId>.tools`: ค่าแทนที่เริ่มต้นของนโยบายเครื่องมือเฉพาะทีม (`allow`/`deny`/`alsoAllow`) ซึ่งใช้เมื่อไม่มีค่าแทนที่ของช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: ค่าแทนที่เริ่มต้นของนโยบายเครื่องมือเฉพาะทีมและผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ค่าแทนที่เฉพาะช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ค่าแทนที่เฉพาะช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: ค่าแทนที่นโยบายเครื่องมือเฉพาะช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: ค่าแทนที่นโยบายเครื่องมือเฉพาะช่องทางและผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน ได้แก่ `channel:`, `id:`, `e164:`, `username:`, `name:` (คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงแมปไปยัง `id:` เท่านั้น)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน - `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (การยืนยันตัวตนแบบสหพันธ์ + ใบรับรอง)
- `channels.msteams.certificateThumbprint`: ลายนิ้วมือใบรับรอง; รองรับแต่ไม่จำเป็นสำหรับการยืนยันตัวตน
- `channels.msteams.useManagedIdentity`: เปิดใช้การยืนยันตัวตนด้วยข้อมูลประจำตัวที่มีการจัดการ (โหมดสหพันธ์)
- `channels.msteams.managedIdentityClientId`: ID ไคลเอนต์สำหรับข้อมูลประจำตัวที่มีการจัดการซึ่งผู้ใช้กำหนด
- `channels.msteams.sharePointSiteId`: ID ไซต์ SharePoint สำหรับการอัปโหลดไฟล์ในการแชทกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในการแชทกลุ่ม](#sending-files-in-group-chats))
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card ต้อนรับที่แสดงเมื่อมีการติดต่อผ่าน DM/กลุ่มครั้งแรก และปุ่มพรอมต์แนะนำของการ์ด
- `channels.msteams.responsePrefix`: ข้อความที่เติมไว้หน้าการตอบกลับขาออก
- `channels.msteams.feedbackEnabled` (ค่าเริ่มต้น `true`), `channels.msteams.feedbackReflection` (ค่าเริ่มต้น `true`), `channels.msteams.feedbackReflectionCooldownMs`: ความคิดเห็นแบบยกนิ้วขึ้น/ลงต่อการตอบกลับ และการติดตามผลด้วยการทบทวนสำหรับความคิดเห็นเชิงลบ
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: การเชื่อมต่อ OAuth ของ Bot Framework และขอบเขต Graph ที่มอบหมายสำหรับโฟลว์ที่อาศัย SSO; `sso.enabled: true` ต้องใช้ `sso.connectionName`

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันใช้รูปแบบมาตรฐานของเอเจนต์ (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความโดยตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความในช่องทาง/กลุ่มใช้ ID การสนทนา:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดเทียบกับโพสต์

Teams มี UI ช่องทางสองรูปแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                   | คำอธิบาย                                                  | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **โพสต์** (แบบคลาสสิก)      | ข้อความปรากฏเป็นการ์ดโดยมีการตอบกลับแบบเธรดอยู่ด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **เธรด** (คล้าย Slack) | ข้อความไหลต่อเนื่องเป็นแนวเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** API ของ Teams ไม่ได้เปิดเผยว่าช่องทางใช้ UI รูปแบบใด หากใช้ `replyStyle` ผิด:

- `thread` ในช่องทางรูปแบบเธรด → การตอบกลับจะซ้อนกันอย่างไม่เป็นธรรมชาติ
- `top-level` ในช่องทางรูปแบบโพสต์ → การตอบกลับจะปรากฏเป็นโพสต์ระดับบนสุดแยกต่างหากแทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนดค่า `replyStyle` แยกตามช่องทางโดยอิงตามการตั้งค่าของช่องทาง:

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

### ลำดับความสำคัญในการกำหนดค่า

เมื่อบอตส่งการตอบกลับไปยังช่องทาง ระบบจะหาค่า `replyStyle` จากค่าแทนที่ที่เฉพาะเจาะจงที่สุดไล่ลงมาจนถึงค่าเริ่มต้น โดยใช้ค่าแรกที่ไม่ใช่ `undefined`:

1. **เฉพาะช่องทาง** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **เฉพาะทีม** - `channels.msteams.teams.<teamId>.replyStyle`
3. **ส่วนกลาง** - `channels.msteams.replyStyle`
4. **ค่าเริ่มต้นโดยนัย** - อนุมานจาก `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

หากตั้งค่า `requireMention: false` เป็นส่วนกลางโดยไม่มี `replyStyle` ที่ระบุชัดเจน การกล่าวถึงในช่องทางรูปแบบโพสต์จะปรากฏเป็นโพสต์ระดับบนสุด แม้ว่าข้อความขาเข้าจะเป็นการตอบกลับในเธรดก็ตาม กำหนด `replyStyle: "thread"` แบบตายตัวที่ระดับส่วนกลาง ทีม หรือช่องทางเพื่อหลีกเลี่ยงพฤติกรรมที่ไม่คาดคิด

สำหรับการส่งเชิงรุกไปยังการสนทนาในช่องทางที่จัดเก็บไว้ (การตอบกลับจากการเรียกใช้เครื่องมือที่เข้าคิวไว้ เอเจนต์ที่ทำงานเป็นเวลานาน) จะใช้การกำหนดค่าทีม/ช่องทางแบบเดียวกัน ส่วนการแชทกลุ่มและการสนทนาส่วนตัว (DM) จะกำหนดเป็น `top-level` สำหรับการส่งเชิงรุกเสมอโดยไม่คำนึงถึง `replyStyle`

### การรักษาบริบทของเธรด

เมื่อ `replyStyle: "thread"` มีผลและบอตถูก @mention จากภายในเธรดของช่องทาง OpenClaw จะแนบรากของเธรดเดิมกลับเข้าไปในการอ้างอิงการสนทนาขาออก (`19:...@thread.tacv2;messageid=<root>`) เพื่อให้การตอบกลับไปอยู่ในเธรดเดิม ซึ่งใช้ได้ทั้งการส่งแบบสด (ภายในเทิร์น) และการส่งเชิงรุกหลังจากบริบทเทิร์นของ Bot Framework หมดอายุแล้ว (เช่น เอเจนต์ที่ทำงานเป็นเวลานาน การตอบกลับจากการเรียกใช้เครื่องมือที่เข้าคิวผ่าน `mcp__openclaw__message`)

รากของเธรดนำมาจาก `threadId` ที่จัดเก็บไว้ในการอ้างอิงการสนทนา การอ้างอิงที่จัดเก็บไว้รุ่นเก่าซึ่งมีอยู่ก่อน `threadId` จะย้อนกลับไปใช้ `activityId` (กิจกรรมขาเข้าใดก็ตามที่ใช้ตั้งต้นการสนทนาครั้งล่าสุด) เพื่อให้การติดตั้งใช้งานที่มีอยู่ยังคงทำงานได้โดยไม่ต้องตั้งต้นใหม่

เมื่อ `replyStyle: "top-level"` มีผล ระบบจะตั้งใจตอบข้อความขาเข้าจากเธรดของช่องทางเป็นโพสต์ระดับบนสุดใหม่ โดยไม่แนบส่วนต่อท้ายของเธรด ซึ่งเป็นพฤติกรรมที่ถูกต้องสำหรับช่องทางรูปแบบเธรด หากเห็นโพสต์ระดับบนสุดในตำแหน่งที่คาดว่าจะเป็นการตอบกลับในเธรด แสดงว่า `replyStyle` ถูกตั้งค่าไม่ถูกต้องสำหรับช่องทางนั้น

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดในปัจจุบัน:**

- **DM:** รูปภาพและไฟล์แนบทำงานผ่าน API ไฟล์ของบอต Teams
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในพื้นที่จัดเก็บ M365 (SharePoint/OneDrive) เพย์โหลด Webhook มีเพียงสตับ HTML ไม่ใช่ไบต์จริงของไฟล์ **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งที่ระบุไฟล์ก่อนอย่างชัดเจน ให้ใช้ `action=upload-file` ร่วมกับ `media` / `filePath` / `path`; `message` ซึ่งเป็นตัวเลือกจะกลายเป็นข้อความ/ความคิดเห็นประกอบ และ `filename` (หรือ `title`) จะแทนที่ชื่อไฟล์ที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความในช่องทางที่มีรูปภาพจะมาถึงในรูปแบบข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
โดยค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ของ Microsoft/Teams เท่านั้น แทนที่ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
ระบบจะแนบส่วนหัว Authorization เฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นเป็นโฮสต์ Graph + Bot Framework) ควรกำหนดรายการนี้อย่างเข้มงวด (หลีกเลี่ยงส่วนต่อท้ายแบบหลายผู้เช่า)

## การส่งไฟล์ในการแชทกลุ่ม

บอตสามารถส่งไฟล์ใน DM โดยใช้โฟลว์ FileConsentCard ที่มีในตัว **การส่งไฟล์ในการแชทกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่จำเป็น                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                            |
| **การแชทกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → การ์ดไฟล์แบบเนทีฟ      | ต้องใช้ `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | แบบอินไลน์ที่เข้ารหัส Base64                        | ใช้งานได้ทันที                            |

### เหตุผลที่การแชทกลุ่มต้องใช้ SharePoint

บอตใช้ข้อมูลประจำตัวของแอปพลิเคชัน ขณะที่ทรัพยากร `/me` ของ Microsoft Graph [ต้องมีผู้ใช้ที่ลงชื่อเข้าใช้](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0) ในการส่งไฟล์ในการแชทกลุ่ม/ช่องทาง บอตจะอัปโหลดไฟล์ไปยัง **ไซต์ SharePoint** และสร้างลิงก์สำหรับแชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `ChatMember.Read.All` (Application) - สิทธิ์ทั่วทั้งผู้เช่าที่มีสิทธิ์น้อยที่สุดสำหรับการส่งไฟล์ในการแชทกลุ่ม `Chat.Read.All` ก็ใช้ได้เช่นกันและครอบคลุมกรณีนี้อยู่แล้วเมื่อเปิดใช้ประวัติการแชทกลุ่ม อีกทางเลือกหนึ่งสำหรับแต่ละแชทคือใช้[สิทธิ์ความยินยอมเฉพาะทรัพยากร](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`
2. **ให้ความยินยอมของผู้ดูแลระบบ** สำหรับผู้เช่า
3. **รับ ID ไซต์ SharePoint ของคุณ:**

   ```bash
   # ผ่าน Graph Explorer หรือ curl พร้อมโทเค็นที่ถูกต้อง:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # ตัวอย่าง: สำหรับไซต์ที่ "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # การตอบกลับประกอบด้วย: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **กำหนดค่า OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... การกำหนดค่าอื่นๆ ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### ลักษณะการแชร์

| บริบทและสิทธิ์                                                  | ลักษณะการแชร์                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| แชนเนล + `Sites.ReadWrite.All`                                         | ลิงก์แชร์ทั่วทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| แชตกลุ่ม + `Sites.ReadWrite.All` + สิทธิ์อ่านสมาชิกแชตที่รองรับ | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกแชตที่เข้าถึงได้)      |
| แชตกลุ่มที่ไม่มีสิทธิ์อ่านสมาชิกแชตที่รองรับ                   | การส่งล้มเหลวแบบปิดกั้น                                         |

การแชร์รายผู้ใช้มีความปลอดภัยมากกว่า เนื่องจากมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ OpenClaw กำหนดให้การค้นหาสมาชิกสำหรับแชตกลุ่มต้องสำเร็จ การหมดเวลา ความล้มเหลวของการรับส่ง ผลลัพธ์ว่าง และการปฏิเสธจาก Graph API จะทำให้การส่งล้มเหลวแทนที่จะขยายสิทธิ์การเข้าถึงไปยังทั้งองค์กร

### ลักษณะการทำงานสำรอง

| สถานการณ์                                                         | ผลลัพธ์                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| แชตกลุ่ม + ไฟล์ + กำหนดค่าสิทธิ์ SharePoint และสมาชิกแล้ว | อัปโหลดไปยัง SharePoint แล้วส่งการ์ดไฟล์แบบเนทีฟ    |
| แชตกลุ่ม + ไฟล์ + ไม่มีสิทธิ์ SharePoint หรือสมาชิก     | ล้มเหลวพร้อมข้อผิดพลาดการกำหนดค่าที่นำไปแก้ไขได้      |
| แชนเนล + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว                   | อัปโหลดไปยัง SharePoint แล้วส่งการ์ดไฟล์แบบเนทีฟ    |
| แชตส่วนตัว + ไฟล์                                             | ขั้นตอน FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint)  |
| ทุกบริบท + รูปภาพ                                              | ฝังแบบเข้ารหัส Base64 (ทำงานได้โดยไม่ต้องใช้ SharePoint) |

### ตำแหน่งจัดเก็บไฟล์

ไฟล์ที่อัปโหลดจะจัดเก็บไว้ในโฟลเดอร์ `/OpenClawShared/` ภายในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## แบบสำรวจ (Adaptive Cards)

OpenClaw ส่งแบบสำรวจของ Teams เป็น Adaptive Cards (Teams ไม่มี API แบบสำรวจแบบเนทีฟ)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Gateway บันทึกคะแนนโหวตไว้ใน SQLite สถานะ Plugin ของ OpenClaw ภายใต้ `state/openclaw.sqlite`.
- ไฟล์ `msteams-polls.json` ที่มีอยู่จะถูกนำเข้าโดย `openclaw doctor --fix` ไม่ใช่โดย Plugin ที่กำลังทำงาน
- Gateway ต้องออนไลน์อยู่เสมอเพื่อบันทึกคะแนนโหวต
- แบบสำรวจจะไม่โพสต์สรุปผลโดยอัตโนมัติ และยังไม่มี CLI สำหรับผลแบบสำรวจ

## การ์ดการนำเสนอ

ส่งเพย์โหลดการนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนาใน Teams โดยใช้เครื่องมือ `message`, CLI หรือการส่งคำตอบตามปกติ OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` ข้อความของข้อความจะไม่บังคับ ปุ่มจะแสดงผลเป็นการดำเนินการส่งข้อมูลหรือ URL ของ Adaptive Card เมนูเลือกไม่ใช่ฟังก์ชันแบบเนทีฟในตัวแสดงผล Teams ดังนั้น OpenClaw จะแปลงเป็นข้อความที่อ่านได้ก่อนส่ง

**เครื่องมือเอเจนต์:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "สวัสดี",
    blocks: [{ type: "text", text: "สวัสดี!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"สวัสดี","blocks":[{"type":"text","text":"สวัสดี!"}]}'
```

ดูรายละเอียดรูปแบบเป้าหมายที่ [รูปแบบเป้าหมาย](#target-formats) ด้านล่าง

## รูปแบบเป้าหมาย

เป้าหมาย MSTeams ใช้คำนำหน้าเพื่อแยกความแตกต่างระหว่างผู้ใช้กับการสนทนา:

| ประเภทเป้าหมาย         | รูปแบบ                           | ตัวอย่าง                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ผู้ใช้ (ตาม ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| ผู้ใช้ (ตามชื่อ)      | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)                                                                 |
| กลุ่ม/แชนเนล       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| กลุ่ม/แชนเนล (แบบดิบ) | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` หรือ Bot Framework id แบบไม่มีคำนำหน้าของ `a:`/`8:orgid:`/`29:` |

**ตัวอย่าง CLI:**

```bash
# ส่งให้ผู้ใช้ตาม ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "สวัสดี"

# ส่งให้ผู้ใช้ตามชื่อที่แสดง (เรียกใช้การค้นหาด้วย Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "สวัสดี"

# ส่งไปยังแชตกลุ่มหรือแชนเนล
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "สวัสดี"

# ส่งการ์ดการนำเสนอไปยังการสนทนา
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"สวัสดี","blocks":[{"type":"text","text":"สวัสดี"}]}'
```

**ตัวอย่างเครื่องมือเอเจนต์:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "สวัสดี!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "สวัสดี",
    blocks: [{ type: "text", text: "สวัสดี" }],
  },
}
```

<Note>
หากไม่มีคำนำหน้า `user:` ชื่อจะใช้การค้นหากลุ่มหรือทีมเป็นค่าเริ่มต้น ใช้ `user:` เสมอเมื่อกำหนดเป้าหมายเป็นบุคคลตามชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- ข้อความเชิงรุกสามารถส่งได้ **หลังจาก** ผู้ใช้โต้ตอบแล้วเท่านั้น เนื่องจาก OpenClaw จะจัดเก็บการอ้างอิงการสนทนาในจุดนั้น
- ดู `dmPolicy` และการควบคุมด้วยรายการอนุญาตได้ที่ [/gateway/configuration](/th/gateway/configuration)

## ID ทีมและแชนเนล (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์คำสืบค้น `groupId` ใน URL ของ Teams **ไม่ใช่** ID ทีมที่ใช้สำหรับการกำหนดค่า ให้แยก ID จากพาธ URL แทน:

**URL ทีม:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID การสนทนาของทีม (ถอดรหัส URL ค่านี้)
```

**URL แชนเนล:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID แชนเนล (ถอดรหัส URL ค่านี้)
```

**สำหรับการกำหนดค่า:**

- คีย์ทีม = ส่วนพาธหลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`; เทนเนนต์รุ่นเก่าอาจแสดง `@thread.skype` ซึ่งใช้ได้เช่นกัน)
- คีย์แชนเนล = ส่วนพาธหลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ไม่ต้องสนใจ** พารามิเตอร์คำสืบค้น `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw ค่านี้คือ ID กลุ่ม Microsoft Entra ไม่ใช่ ID การสนทนา Bot Framework ที่ใช้ในกิจกรรม Teams ขาเข้า

## แชนเนลส่วนตัว

บอตรองรับแชนเนลส่วนตัวอย่างจำกัด:

| คุณสมบัติ                      | แชนเนลมาตรฐาน | แชนเนลส่วนตัว       |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอต             | ได้               | จำกัด                |
| ข้อความแบบเรียลไทม์ (Webhook) | ได้               | อาจไม่ทำงาน           |
| สิทธิ์ RSC              | ได้               | อาจมีลักษณะการทำงานต่างออกไป |
| @mentions                    | ได้               | หากเข้าถึงบอตได้   |
| ประวัติ Graph API            | ได้               | ได้ (เมื่อมีสิทธิ์) |

**วิธีแก้ปัญหาหากแชนเนลส่วนตัวไม่ทำงาน:**

1. ใช้แชนเนลมาตรฐานสำหรับการโต้ตอบกับบอต
2. ใช้ DM ผู้ใช้สามารถส่งข้อความถึงบอตโดยตรงได้เสมอ
3. ใช้ Graph API เพื่อเข้าถึงประวัติ (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในแชนเนล:** ไม่มีสิทธิ์ Graph หรือความยินยอมจากผู้ดูแลระบบ ติดตั้งแอป Teams ใหม่ จากนั้นปิด Teams โดยสมบูรณ์แล้วเปิดอีกครั้ง
- **ไม่มีการตอบกลับในแชนเนล:** ค่าเริ่มต้นกำหนดให้ต้องกล่าวถึง ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าแยกตามทีม/แชนเนล
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดงไฟล์ manifest เก่า):** ลบแอปแล้วเพิ่มใหม่ จากนั้นปิด Teams โดยสมบูรณ์เพื่อรีเฟรช
- **401 Unauthorized จาก Webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT ซึ่งหมายความว่าสามารถเข้าถึงปลายทางได้ แต่การตรวจสอบสิทธิ์ล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลดไฟล์ manifest

- **"Icon file cannot be empty":** ไฟล์ manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ ให้สร้างไอคอน PNG ที่ถูกต้อง (32x32 สำหรับ `outline.png`, 192x192 สำหรับ `color.png`)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชตอื่น ให้ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การเปลี่ยนแปลงเผยแพร่
- **"Something went wrong" ขณะอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบเนื้อหาการตอบกลับเพื่อดูข้อผิดพลาดจริง
- **การไซด์โหลดล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" ซึ่งมักช่วยหลีกเลี่ยงข้อจำกัดการไซด์โหลดได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตทุกประการ
2. อัปโหลดแอปใหม่และติดตั้งใหม่ในทีม/แชต
3. ตรวจสอบว่าผู้ดูแลระบบขององค์กรบล็อกสิทธิ์ RSC หรือไม่
4. ยืนยันว่าใช้ขอบเขตที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม และ `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## เอกสารอ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมาไฟล์ manifest ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความจากแชนเนลด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [เอกสารอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอต Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (แชนเนล/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับการจัดการบอต

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนผ่าน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) - ลักษณะการทำงานของแชทกลุ่มและการจำกัดให้ตอบสนองเมื่อมีการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความมั่นคงปลอดภัย
