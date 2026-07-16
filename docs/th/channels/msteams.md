---
read_when:
    - การพัฒนาฟีเจอร์ช่อง Microsoft Teams
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าบอต Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T18:51:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

สถานะ: รองรับข้อความ + ไฟล์แนบใน DM; การส่งไฟล์ในแชนเนล/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats)) โพลจะส่งผ่าน Adaptive Cards การดำเนินการกับข้อความเปิดเผย `upload-file` อย่างชัดเจนสำหรับการส่งที่มีไฟล์เป็นลำดับแรก

## Plugin ที่มาพร้อมระบบ

Microsoft Teams จัดส่งเป็น Plugin ที่มาพร้อมระบบใน OpenClaw รุ่นปัจจุบัน โดยไม่ต้องติดตั้งแยกสำหรับบิลด์แพ็กเกจปกติ

สำหรับบิลด์รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Teams ซึ่งมาพร้อมระบบ ให้ติดตั้งแพ็กเกจ npm โดยตรง:

```bash
openclaw plugins install @openclaw/msteams
```

ใช้ชื่อแพ็กเกจเปล่าเพื่อติดตามแท็กรุ่นเผยแพร่อย่างเป็นทางการล่าสุด ตรึงเวอร์ชันที่แน่นอนเฉพาะเมื่อต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

เช็กเอาต์ภายในเครื่อง (เรียกใช้จากรีโพซิทอรี git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) จัดการการลงทะเบียนบอต การสร้าง manifest และการสร้างข้อมูลประจำตัวด้วยคำสั่งเดียว

**1. ติดตั้งและเข้าสู่ระบบ**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # ตรวจสอบว่าคุณเข้าสู่ระบบแล้วและดูข้อมูล tenant ของคุณ
```

<Note>
Teams CLI ยังอยู่ในช่วงพรีวิว คำสั่งและแฟล็กอาจเปลี่ยนแปลงระหว่างรุ่นเผยแพร่
</Note>

**2. เริ่มต้นทันเนล** (Teams ไม่สามารถเข้าถึง localhost ได้)

ติดตั้งและยืนยันตัวตนกับ devtunnel CLI หากจำเป็น ([คู่มือเริ่มต้นใช้งาน](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started))

```bash
# ตั้งค่าครั้งเดียว (URL คงเดิมในแต่ละเซสชัน):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# แต่ละเซสชันการพัฒนา:
devtunnel host my-openclaw-bot
# ปลายทางของคุณ: https://<tunnel-id>.devtunnels.ms/api/messages
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

คำสั่งนี้จะสร้างแอปพลิเคชัน Entra ID (Azure AD), สร้าง client secret, สร้างและอัปโหลด Teams app manifest (พร้อมไอคอน) และลงทะเบียนบอตที่ Teams จัดการ (ไม่ต้องมีการสมัครใช้งาน Azure) เอาต์พุตประกอบด้วย `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` และ **Teams App ID** อีกทั้งยังเสนอให้ติดตั้งแอปใน Teams โดยตรง

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

`teams app create` จะแจ้งให้ติดตั้งแอป ให้เลือก "Install in Teams" หากต้องการรับลิงก์ติดตั้งภายหลัง:

```bash
teams app get <teamsAppId> --install-link
```

**6. ตรวจสอบว่าทุกอย่างทำงาน**

```bash
teams app doctor <teamsAppId>
```

เรียกใช้การวินิจฉัยครอบคลุมการลงทะเบียนบอต การกำหนดค่าแอป AAD ความถูกต้องของ manifest และการตั้งค่า SSO

สำหรับการใช้งานจริง ควรพิจารณา[การยืนยันตัวตนแบบสหพันธ์](#federated-authentication-certificate-plus-managed-identity) (ใบรับรองหรือ managed identity) แทน client secret

<Note>
แชตกลุ่มถูกบล็อกโดยค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (ยังคงต้องมีการกล่าวถึง)
</Note>

## เป้าหมาย

- สนทนากับ OpenClaw ผ่าน DM แชตกลุ่ม หรือแชนเนลของ Teams
- รักษาการกำหนดเส้นทางให้แน่นอน: การตอบกลับจะกลับไปยังแชนเนลต้นทางเสมอ
- ใช้พฤติกรรมที่ปลอดภัยสำหรับแชนเนลเป็นค่าเริ่มต้น (ต้องมีการกล่าวถึง เว้นแต่กำหนดค่าเป็นอย่างอื่น)

## การเขียนการกำหนดค่า

โดยค่าเริ่มต้น Microsoft Teams สามารถเขียนการอัปเดตการกำหนดค่าที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกละเว้นจนกว่าจะได้รับอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่คงที่หรือกลุ่มการเข้าถึงของผู้ส่งแบบคงที่ เช่น `accessGroup:core-team`
- อย่าอาศัยการจับคู่ UPN/ชื่อที่แสดงสำหรับรายการอนุญาต เพราะค่าเหล่านี้เปลี่ยนแปลงได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงเป็นค่าเริ่มต้น ให้เลือกใช้ด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- วิซาร์ดสามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลประจำตัวมีสิทธิ์เพียงพอ

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (ถูกบล็อกเว้นแต่เพิ่ม `groupAllowFrom`) `channels.defaults.groupPolicy` สามารถแทนที่ค่าเริ่มต้นที่ใช้ร่วมกันได้เมื่อไม่ได้ตั้งค่า `channels.msteams.groupPolicy`
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งหรือกลุ่มการเข้าถึงของผู้ส่งแบบคงที่ใดสามารถทริกเกอร์ในแชตกลุ่ม/แชนเนลได้ (ใช้ `channels.msteams.allowFrom` เป็นค่าทดแทน)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (ค่าเริ่มต้นยังคงต้องมีการกล่าวถึง)
- หากต้องการบล็อกแชนเนล **ทั้งหมด** ให้ตั้งค่า `channels.msteams.groupPolicy: "disabled"`

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

**รายการอนุญาตของทีม + แชนเนล**

- จำกัดขอบเขตการตอบกลับในกลุ่ม/แชนเนลโดยระบุทีมและแชนเนลภายใต้ `channels.msteams.teams`
- ใช้ Teams conversation ID ที่คงที่จากลิงก์ Teams เป็นคีย์ ไม่ใช่ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ (ดู [ID ของทีมและแชนเนล](#team-and-channel-ids-common-gotcha))
- เมื่อมี `groupPolicy="allowlist"` และรายการอนุญาตของทีม ระบบจะยอมรับเฉพาะทีม/แชนเนลที่ระบุไว้เท่านั้น (ต้องมีการกล่าวถึง)
- วิซาร์ดการกำหนดค่ายอมรับรายการ `Team/Channel` และจัดเก็บให้โดยอัตโนมัติ
- เมื่อเริ่มต้น OpenClaw จะแปลงชื่อทีม/แชนเนลและชื่อในรายการอนุญาตของผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต) และบันทึกการจับคู่ลงในล็อก ชื่อที่แปลงไม่ได้จะคงอยู่ตามที่พิมพ์ แต่จะถูกละเว้นในการกำหนดเส้นทาง เว้นแต่ตั้งค่า `channels.msteams.dangerouslyAllowNameMatching: true`

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

1. ตรวจสอบว่า Microsoft Teams Plugin พร้อมใช้งาน (มาพร้อมระบบในรุ่นปัจจุบัน)
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอต รวมถึงสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงในทีม (หรือขอบเขตส่วนบุคคลสำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) และเริ่มต้น Gateway
6. Gateway รอรับทราฟฟิก Webhook ของ Bot Framework บน `/api/messages` โดยค่าเริ่มต้น

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | ฟิลด์              | ค่า                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำ) |
   | **Subscription**   | เลือกการสมัครใช้งาน Azure ของคุณ                           |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่                               |
   | **Pricing tier**   | **Free** สำหรับการพัฒนา/ทดสอบ                                 |
   | **Type of App**    | **Single Tenant** (แนะนำ; ดูหมายเหตุด้านล่าง)          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
การสร้างบอตแบบหลาย tenant ใหม่ถูกเลิกใช้หลังจาก 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่
</Warning>

3. คลิก **Review + create** จากนั้นคลิก **Create** (ประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลประจำตัว

1. ทรัพยากร Azure Bot → **Configuration** → คัดลอก **Microsoft App ID** (`appId` ของคุณ)
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → คัดลอก **Value** (`appPassword` ของคุณ)
3. **Overview** → คัดลอก **Directory (tenant) ID** (`tenantId` ของคุณ)

### ขั้นตอนที่ 3: กำหนดค่าปลายทางการรับส่งข้อความ

1. Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint**:
   - การใช้งานจริง: `https://your-domain.com/api/messages`
   - การพัฒนาภายในเครื่อง: ใช้ทันเนล (ดู [การพัฒนาภายในเครื่อง](#local-development-tunneling))

### ขั้นตอนที่ 4: เปิดใช้งานแชนเนล Teams

1. Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

### ขั้นตอนที่ 5: สร้าง Teams app manifest

- ใส่รายการ `bot` พร้อม `botId = <App ID>`
- ขอบเขต: `personal`, `team`, `groupChat`
- `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล)
- เพิ่มสิทธิ์ RSC (ดู [สิทธิ์ RSC](#current-teams-rsc-permissions-manifest))
- สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
- บีบอัด `manifest.json`, `outline.png` และ `color.png` ไว้ด้วยกัน

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

แชนเนล Teams จะเริ่มทำงานโดยอัตโนมัติเมื่อ Plugin พร้อมใช้งานและการกำหนดค่า `msteams` มีข้อมูลประจำตัว

</details>

## การยืนยันตัวตนแบบสหพันธ์ (ใบรับรองร่วมกับ managed identity)

สำหรับการใช้งานจริง OpenClaw รองรับ **การยืนยันตัวตนแบบสหพันธ์** เป็นทางเลือกแทน client secret ผ่าน `channels.msteams.authType: "federated"` โดยมีสองวิธี:

### ตัวเลือก A: การยืนยันตัวตนด้วยใบรับรอง

ใช้ใบรับรอง PEM ที่ลงทะเบียนกับการลงทะเบียนแอป Entra ID ของคุณ

**การตั้งค่า:**

1. สร้างหรือขอรับใบรับรอง (รูปแบบ PEM พร้อมคีย์ส่วนตัว)
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → อัปโหลดใบรับรองสาธารณะ

**การกำหนดค่า:**

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

1. พ็อด/VM ของบอตมี managed identity (กำหนดโดยระบบหรือผู้ใช้)
2. ข้อมูลประจำตัวแบบ federated identity เชื่อม managed identity เข้ากับการลงทะเบียนแอป Entra ID
3. ขณะรันไทม์ OpenClaw ใช้ `@azure/identity` เพื่อรับโทเค็นจากปลายทาง Azure IMDS
4. โทเค็นจะถูกส่งไปยัง Teams SDK เพื่อยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้ managed identity (AKS workload identity, App Service, VM)
- ข้อมูลประจำตัวแบบ federated ที่สร้างไว้ในการลงทะเบียนแอป Entra ID
- การเข้าถึง IMDS (`169.254.169.254:80`) ผ่านเครือข่ายจากพ็อด/VM

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
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**การกำหนดค่า (managed identity ที่ผู้ใช้กำหนด):** เพิ่ม `managedIdentityClientId: "<MI_CLIENT_ID>"` ลงในบล็อกด้านบน

**ตัวแปรสภาพแวดล้อม:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะที่ผู้ใช้กำหนด)

### การตั้งค่า AKS Workload Identity

สำหรับการติดตั้งใช้งาน AKS ที่ใช้ workload identity:

1. **เปิดใช้ workload identity** บนคลัสเตอร์ AKS
2. **สร้างข้อมูลประจำตัวแบบ federated** ในการลงทะเบียนแอป Entra ID:

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

4. **เพิ่มป้ายกำกับให้พ็อด** เพื่อแทรก workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **อนุญาตการเข้าถึงผ่านเครือข่าย** ไปยัง IMDS (`169.254.169.254`): หากใช้ NetworkPolicy ให้เพิ่มกฎขาออกสำหรับ `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธีการ               | การกำหนดค่า                                         | ข้อดี                               | ข้อเสีย                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **รหัสลับไคลเอนต์**    | `appPassword`                                  | ตั้งค่าได้ง่าย                       | ต้องหมุนเวียนรหัสลับและมีความปลอดภัยน้อยกว่า |
| **ใบรับรอง**      | `authType: "federated"` + `certificatePath`    | ไม่มีรหัสลับที่ใช้ร่วมกันส่งผ่านเครือข่าย      | มีภาระในการจัดการใบรับรอง       |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ต้องใช้รหัสผ่านและไม่มีรหัสลับให้จัดการ | ต้องมีโครงสร้างพื้นฐาน Azure         |

สามารถตั้งค่า `certificateThumbprint` ควบคู่กับ `certificatePath` ได้ แต่ปัจจุบันเส้นทางการยืนยันตัวตนจะไม่อ่านค่านี้ โดยยอมรับไว้เพื่อความเข้ากันได้ในอนาคตเท่านั้น

**ค่าเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนด้วยรหัสลับไคลเอนต์ (`appPassword`) การกำหนดค่าที่มีอยู่จะยังคงทำงานได้โดยไม่เปลี่ยนแปลง

## การพัฒนาในเครื่อง (การทำอุโมงค์)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้อุโมงค์สำหรับการพัฒนาแบบถาวรเพื่อให้ URL คงเดิมระหว่างเซสชัน:

```bash
# ตั้งค่าครั้งเดียว:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# ในแต่ละเซสชันการพัฒนา:
devtunnel host my-openclaw-bot
```

ทางเลือก: `ngrok http 3978` หรือ `tailscale funnel 3978` (URL อาจเปลี่ยนแปลงในแต่ละเซสชัน)

หาก URL ของอุโมงค์เปลี่ยน ให้ปรับปรุงปลายทาง:

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
2. ค้นหาบอตใน Teams และส่ง DM
3. ตรวจสอบบันทึกของ Gateway เพื่อดูกิจกรรมขาเข้า

## ตัวแปรสภาพแวดล้อม

คีย์การกำหนดค่าที่เกี่ยวข้องกับการยืนยันตัวตนเหล่านี้สามารถตั้งค่าผ่านตัวแปรสภาพแวดล้อมแทน `openclaw.json` ได้ (คีย์การกำหนดค่าอื่น เช่น `groupPolicy` หรือ `historyLimit` ตั้งค่าได้ผ่านการกำหนดค่าเท่านั้น):

| ตัวแปรสภาพแวดล้อม                              | คีย์การกำหนดค่า                | หมายเหตุ                               |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` หรือ `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | federated + ใบรับรอง             |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | ยอมรับได้ แต่ไม่จำเป็นสำหรับการยืนยันตัวตน     |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | federated + managed identity        |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | เฉพาะ managed identity ที่ผู้ใช้กำหนด |

## การดำเนินการข้อมูลสมาชิก

OpenClaw มีการดำเนินการ `member-info` ที่ทำงานผ่าน Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถตรวจสอบรายละเอียดรายชื่อสมาชิกที่ยืนยันแล้วสำหรับการสนทนาที่กำหนดค่าไว้

ข้อกำหนด:

- สิทธิ์ RSC `ChannelSettings.Read.Group` และ `TeamMember.Read.Group` (รวมอยู่ในไฟล์ manifest ที่แนะนำแล้ว)

การดำเนินการนี้พร้อมใช้งานทุกครั้งที่กำหนดค่าข้อมูลประจำตัว Graph โดยไม่มีสวิตช์ `channels.msteams.actions.memberInfo` แยกต่างหาก
การค้นหาช่องมาตรฐานจะส่งคืนข้อมูลประจำตัวจากรายชื่อสมาชิกทีมที่ตรงกัน ชื่อที่แสดง อีเมล และบทบาท
ในการแชต DM หรือกลุ่มปัจจุบัน การดำเนินการนี้สามารถส่งคืน ID ผู้ใช้ที่คงที่ของผู้ส่งที่เชื่อถือได้
การค้นหาสมาชิกในช่องส่วนตัว/ช่องที่แชร์และการแชตอื่นที่ไม่ใช่การแชตปัจจุบันต้องใช้สิทธิ์รายชื่อสมาชิกเพิ่มเติม
และจะถูกปฏิเสธโดยเกณฑ์พื้นฐานของสิทธิ์เริ่มต้น

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความล่าสุดของช่อง/กลุ่มที่จะรวมไว้ในพรอมต์ หากไม่มีค่าจะใช้ `messages.groupChat.historyLimit` และใช้ค่าเริ่มต้นเป็น 50 ตั้งค่า `0` เพื่อปิดใช้งาน
- ประวัติเธรดที่ดึงมาจะถูกกรองด้วยรายการผู้ส่งที่อนุญาต (`allowFrom` / `groupAllowFrom`) ดังนั้นการใส่บริบทเริ่มต้นจากเธรดจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่อ้างถึง (แยกวิเคราะห์จาก HTML ของสคีมา Skype Reply ในไฟล์แนบของข้อความตอบกลับเอง) จะถูกส่งผ่านโดยไม่กรอง ปัจจุบันมีเพียงการใส่ประวัติเธรดเป็นบริบทเริ่มต้นเท่านั้นที่ใช้ตัวกรองรายการผู้ส่งที่อนุญาต
- สามารถจำกัดประวัติ DM ด้วย `channels.msteams.dmHistoryLimit` (รอบข้อความของผู้ใช้) การกำหนดค่าเฉพาะผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ RSC ปัจจุบันของ Teams (ไฟล์ manifest)

ต่อไปนี้คือ **สิทธิ์ resourceSpecific ที่มีอยู่** ในไฟล์ manifest ของแอป Teams สิทธิ์เหล่านี้ใช้เฉพาะภายในทีม/การแชตที่ติดตั้งแอปเท่านั้น

**สำหรับช่อง (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความทั้งหมดในช่องโดยไม่ต้อง @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับการแชตกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความทั้งหมดในการแชตกลุ่มโดยไม่ต้อง @mention

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
    name: "องค์กรของคุณ",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw ใน Teams", full: "OpenClaw ใน Teams" },
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

### ข้อควรระวังเกี่ยวกับไฟล์ manifest (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง** ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง** ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวมพื้นผิวที่วางแผนจะใช้ (`personal`, `team`, `groupChat`)
- ต้องมี `bots[].supportsFiles: true` สำหรับการจัดการไฟล์ในขอบเขตส่วนบุคคล
- `authorization.permissions.resourceSpecific` ต้องรวมสิทธิ์อ่าน/ส่งของช่องสำหรับทราฟฟิกของช่อง

### การปรับปรุงแอปที่มีอยู่

```bash
# ดาวน์โหลด แก้ไข และอัปโหลดไฟล์ manifest อีกครั้ง
teams app manifest download <teamsAppId> manifest.json
# แก้ไข manifest.json ในเครื่อง...
teams app manifest upload manifest.json <teamsAppId>
# ระบบจะเพิ่มเวอร์ชันโดยอัตโนมัติหากเนื้อหาเปลี่ยนแปลง
```

หลังจากปรับปรุงแล้ว ให้ติดตั้งแอปอีกครั้งในแต่ละทีม และ **ออกจาก Teams โดยสมบูรณ์แล้วเปิดใหม่** (ไม่ใช่เพียงปิดหน้าต่าง) เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

<details>
<summary>การปรับปรุงไฟล์ manifest ด้วยตนเอง (โดยไม่ใช้ CLI)</summary>

1. ปรับปรุง `manifest.json` ด้วยการตั้งค่าใหม่
2. **เพิ่มค่าฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัดเป็นไฟล์ zip ใหม่** โดยรวมไฟล์ manifest และไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลดไฟล์ zip ใหม่:
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app

</details>

## ความสามารถ: เฉพาะ RSC เทียบกับ Graph

### เมื่อใช้ **เฉพาะ Teams RSC** (ติดตั้งแอปแล้ว แต่ไม่มีสิทธิ์ Graph API)

ใช้งานได้:

- อ่านข้อความ **ข้อความตัวอักษร** ของช่อง
- ส่งเนื้อหา **ข้อความตัวอักษร** ไปยังช่อง
- รับไฟล์แนบใน **ส่วนบุคคล (DM)**

ใช้งานไม่ได้:

- **เนื้อหารูปภาพหรือไฟล์** ของช่อง/กลุ่ม (เพย์โหลดมีเพียงสตับ HTML)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความนอกเหนือจากเหตุการณ์ Webhook แบบสด

### เมื่อใช้ **Teams RSC + สิทธิ์ Application ของ Microsoft Graph**

เพิ่มความสามารถต่อไปนี้:

- ดาวน์โหลดเนื้อหาที่โฮสต์ไว้ (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่จัดเก็บใน SharePoint/OneDrive
- อ่านประวัติข้อความของช่อง/การแชตผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ              | สิทธิ์ RSC      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์**  | ได้ (ผ่าน Webhook)    | ไม่ได้ (ทำได้เฉพาะการโพล)                   |
| **ข้อความย้อนหลัง** | ไม่ได้                   | ได้ (สามารถสืบค้นประวัติได้)             |
| **ความซับซ้อนในการตั้งค่า**    | ใช้เพียงไฟล์ manifest ของแอป    | ต้องได้รับความยินยอมจากผู้ดูแลระบบ + ขั้นตอนโทเค็น |
| **ทำงานแบบออฟไลน์ได้**       | ไม่ได้ (ต้องทำงานอยู่) | ได้ (สืบค้นได้ทุกเมื่อ)                 |

**สรุป:** RSC ใช้สำหรับรับฟังแบบเรียลไทม์ ส่วน Graph API ใช้สำหรับเข้าถึงข้อมูลย้อนหลัง หากต้องการติดตามข้อความที่พลาดไประหว่างออฟไลน์ ต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องได้รับความยินยอมจากผู้ดูแลระบบ)

## สื่อและประวัติที่เปิดใช้ Graph

เปิดใช้เฉพาะสิทธิ์ระดับแอปพลิเคชันของ Microsoft Graph ที่จำเป็นสำหรับขอบเขตและข้อมูล Teams ที่ใช้:

1. Entra ID (Azure AD) **App Registration** → เพิ่ม Graph **Application permissions**:
   - `ChannelMessage.Read.All` สำหรับไฟล์แนบและประวัติของแชนเนล
   - `Chat.Read.All` สำหรับไฟล์แนบและประวัติของแชตกลุ่ม
   - `Files.Read.All` เมื่อต้องดาวน์โหลดไบต์ของไฟล์แนบจากพื้นที่จัดเก็บ SharePoint/OneDrive การตั้งค่าที่ใช้เฉพาะประวัติไม่จำเป็นต้องใช้สิทธิ์นี้
2. **Grant admin consent** สำหรับ tenant
3. เพิ่ม **manifest version** ของแอป Teams อัปโหลดใหม่ และ **ติดตั้งแอปใน Teams ใหม่**
4. **ปิด Teams โดยสมบูรณ์แล้วเปิดใหม่** เพื่อล้างข้อมูลเมตาของแอปที่แคชไว้

### การกู้คืนไฟล์ของแชนเนล/กลุ่ม (`graphMediaFallback`)

Teams อาจนำเครื่องหมายระบุไฟล์ออกจากกิจกรรม HTML ที่ส่งไปยังบอต ในกรณีดังกล่าว กิจกรรม Bot Framework จะแยกไม่ออกจากข้อความ HTML ทั่วไป โดยข้อมูลอ้างอิงไฟล์แนบที่สมบูรณ์จะมีอยู่เฉพาะในสำเนาข้อความบน Graph เท่านั้น

เปิดใช้กลไกสำรองหลังจากให้สิทธิ์ข้างต้นแล้ว:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

การตั้งค่านี้ใช้กับแชนเนลและแชตกลุ่มเท่านั้น โดยจะเพิ่มการค้นหาข้อความผ่าน Graph หนึ่งครั้งเมื่อกิจกรรม HTML ไม่มีสื่อที่ดาวน์โหลดได้โดยตรง รวมถึงข้อความทั่วไปหรือข้อความที่มีเพียงการกล่าวถึง ค่าเริ่มต้นคือ `false` เพื่อไม่ให้การติดตั้งที่มีอยู่มีทราฟฟิก Graph เพิ่มขึ้นหรือเกิดข้อผิดพลาดด้านสิทธิ์โดยอัตโนมัติ

**การกล่าวถึงผู้ใช้:** @mentions ใช้งานได้ทันทีสำหรับผู้ใช้ที่อยู่ในการสนทนาแล้ว หากต้องการค้นหาและกล่าวถึงผู้ใช้แบบไดนามิกที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ความยินยอมจากผู้ดูแลระบบ

## ข้อจำกัดที่ทราบ

### การหมดเวลาของ Webhook

Teams ส่งข้อความผ่าน HTTP Webhook โดย OpenClaw ใช้การหมดเวลาคงที่ของเซิร์ฟเวอร์ HTTP กับตัวรับฟัง Webhook ดังนี้: ไม่มีการทำงาน 30 วินาที, เวลารวมของคำขอ 30 วินาที และ 15 วินาทีสำหรับรับส่วนหัว สื่อขาเข้าและการเสริมบริบทซึ่งเป็นทางเลือกมีงบเวลาร่วมกัน 10 วินาที แต่ Teams SDK ยังคงรอให้รอบการทำงานของเอเจนต์เสร็จก่อนส่งการตอบกลับ Webhook หากรอบการทำงานทั้งหมดนานเกินช่วงเวลาลองใหม่ของ Teams อาจพบว่า:

- Teams ลองส่งข้อความอีกครั้ง (ทำให้เกิดข้อความซ้ำ)
- การตอบกลับถูกทิ้ง

ระบบจะส่งการตอบกลับเชิงรุกเมื่อเอเจนต์ตอบแล้ว แต่การทำงานของเอเจนต์ที่ช้ายังคงอาจทำให้เกิดการลองใหม่หรือข้อความซ้ำในฝั่ง Teams

### การรองรับคลาวด์ Teams และ URL บริการ

เส้นทาง Teams ที่ใช้ SDK นี้ผ่านการตรวจสอบแบบสดแล้วสำหรับ Microsoft Teams public cloud

การตอบกลับขาเข้าใช้บริบทรอบการทำงานของ Teams SDK จากข้อความขาเข้า การดำเนินการเชิงรุกนอกบริบท ได้แก่ การส่ง การแก้ไข การลบ การ์ด แบบสำรวจ ข้อความขอความยินยอมเกี่ยวกับไฟล์ และการตอบกลับที่ใช้เวลานานในคิว จะใช้ข้อมูลอ้างอิงการสนทนาที่จัดเก็บไว้ `serviceUrl` โดยค่าเริ่มต้น public cloud จะใช้สภาพแวดล้อม public cloud ของ Teams SDK และอนุญาตข้อมูลอ้างอิงที่จัดเก็บไว้บนโฮสต์ Teams Connector สาธารณะ: `https://smba.trafficmanager.net/`

Public cloud เป็นค่าเริ่มต้น ไม่จำเป็นต้องตั้งค่า `channels.msteams.cloud` หรือ `channels.msteams.serviceUrl` สำหรับบอต public cloud ทั่วไป

สำหรับคลาวด์ Teams ที่ไม่ใช่สาธารณะ ให้ตั้งค่า `cloud` และขอบเขตเชิงรุกที่ตรงกันเมื่อ Microsoft เผยแพร่:

- `channels.msteams.cloud` เลือกค่าที่กำหนดไว้ล่วงหน้าสำหรับคลาวด์ของ Teams SDK ซึ่งใช้กับการยืนยันตัวตน การตรวจสอบ JWT บริการโทเค็น และขอบเขต Graph
- `channels.msteams.serviceUrl` เลือกขอบเขตปลายทาง Bot Connector ที่ใช้ตรวจสอบข้อมูลอ้างอิงการสนทนาที่จัดเก็บไว้ ก่อนดำเนินการส่ง แก้ไข ลบ การ์ด แบบสำรวจ ข้อความขอความยินยอมเกี่ยวกับไฟล์ และการตอบกลับที่ใช้เวลานานในคิวแบบเชิงรุก ค่านี้จำเป็นสำหรับคลาวด์ SDK แบบ USGov และ DoD สำหรับ China/21Vianet นั้น OpenClaw ใช้ค่าที่กำหนดไว้ล่วงหน้า `China` ของ SDK และยอมรับ URL บริการที่จัดเก็บ/กำหนดค่าไว้เฉพาะบนโฮสต์แชนเนล Azure China Bot Framework เท่านั้น

Microsoft เผยแพร่ปลายทาง Bot Connector เชิงรุกทั่วโลกไว้ในส่วน [สร้างการสนทนา](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) ของเอกสารการส่งข้อความเชิงรุกของ Teams ใช้ `serviceUrl` ของกิจกรรมขาเข้าเมื่อมี มิฉะนั้นให้ใช้ตารางของ Microsoft ด้านล่าง

| สภาพแวดล้อม Teams | การกำหนดค่า OpenClaw                                             | `serviceUrl` เชิงรุก                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | ไม่ต้องกำหนดค่า cloud/serviceUrl                           | `https://smba.trafficmanager.net/teams`            |
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

`channels.msteams.serviceUrl` จำกัดให้ใช้ได้เฉพาะกับโฮสต์ Microsoft Teams Bot Connector ที่รองรับ เมื่อกำหนดค่า URL บริการแล้ว OpenClaw จะตรวจสอบว่า `serviceUrl` ของการสนทนาที่จัดเก็บไว้ใช้โฮสต์เดียวกัน ก่อนดำเนินการส่ง แก้ไข ลบ การ์ด แบบสำรวจ หรือการตอบกลับที่ใช้เวลานานในคิวแบบเชิงรุก เมื่อใช้การกำหนดค่า public cloud เริ่มต้น OpenClaw จะปฏิเสธโดยค่าเริ่มต้นหากการสนทนาที่จัดเก็บไว้ชี้ไปนอกโฮสต์ Teams Connector สาธารณะ หลังจากเปลี่ยนการตั้งค่าคลาวด์/URL บริการ ให้รับข้อความใหม่จากการสนทนาเพื่อให้ข้อมูลอ้างอิงการสนทนาที่จัดเก็บไว้เป็นปัจจุบัน

China/21Vianet ไม่มี URL `smba` เชิงรุกส่วนกลางแยกต่างหากในตารางปลายทางเชิงรุกของ Teams จาก Microsoft ให้กำหนดค่า `cloud: "China"` เพื่อให้ Teams SDK ใช้ปลายทางการยืนยันตัวตน โทเค็น และ JWT ของ Azure China จากนั้นการส่งเชิงรุกจะต้องใช้ข้อมูลอ้างอิงการสนทนาที่จัดเก็บไว้จากกิจกรรม China Teams ขาเข้า หรือ URL บริการที่กำหนดค่าไว้อย่างชัดเจน บนขอบเขตแชนเนล Azure China Bot Framework (`*.botframework.azure.cn`) ตัวช่วย Teams ที่อาศัย Graph จะถูกปิดใช้สำหรับ `cloud: "China"` จนกว่า OpenClaw จะกำหนดเส้นทางคำขอ Graph ผ่านปลายทาง Azure China Graph

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับแบบสำรวจและการส่งการนำเสนอเชิงความหมาย (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดูรูปแบบที่ใช้ร่วมกันของแชนเนลได้ที่ [/gateway/configuration](/th/gateway/configuration)):

- `channels.msteams.enabled`: เปิด/ปิดใช้งานช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลประจำตัวของบอต
- `channels.msteams.cloud`: สภาพแวดล้อมคลาวด์ของ Teams SDK (`Public`, `USGov`, `USGovDoD` หรือ `China`; ค่าเริ่มต้นคือ `Public`) ตั้งค่าด้วย `serviceUrl` สำหรับคลาวด์ SDK ของ USGov/DoD ส่วนจีนใช้ค่าที่กำหนดไว้ล่วงหน้าของ SDK และการอ้างอิงการสนทนา Azure China Bot Framework ที่จัดเก็บไว้ โดยปิดใช้งานตัวช่วยที่อาศัย Graph จนกว่าจะรองรับการกำหนดเส้นทาง Graph ของ Azure China
- `channels.msteams.serviceUrl`: ขอบเขต URL ของบริการ Bot Connector สำหรับการดำเนินการเชิงรุกของ SDK คลาวด์สาธารณะใช้ค่าเริ่มต้นของ SDK; ให้ตั้งค่าสำหรับ GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High หรือ DoD จีนยอมรับโฮสต์ช่องทาง Azure China Bot Framework เมื่อการอ้างอิงการสนทนาที่จัดเก็บไว้มาจาก Teams ที่ดำเนินการโดย 21Vianet
- `channels.msteams.webhook.port` (ค่าเริ่มต้นคือ `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้นคือ `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้นคือ `pairing`)
- `channels.msteams.allowFrom`: รายการอนุญาตสำหรับ DM (แนะนำให้ใช้ ID อ็อบเจกต์ AAD) ตัวช่วยตั้งค่าจะแปลงชื่อเป็น ID ระหว่างการตั้งค่าเมื่อเข้าถึง Graph ได้
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ฉุกเฉินเพื่อเปิดใช้การจับคู่ UPN/ชื่อที่แสดงซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางด้วยชื่อทีม/ช่องทางโดยตรงอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาดส่วนข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้นคือ `4000` และจำกัดสูงสุดแบบตายตัวที่ `4000` แม้ค่าที่กำหนดไว้จะสูงกว่านั้น)
- `channels.msteams.streaming.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.msteams.mediaAllowHosts`: รายการอนุญาตสำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นคือโดเมน Microsoft/Teams ได้แก่ Graph, SharePoint/OneDrive, Teams CDN, Bot Framework และ Azure Media Services)
- `channels.msteams.mediaAuthAllowHosts`: รายการอนุญาตสำหรับแนบส่วนหัว Authorization เมื่อพยายามรับสื่อซ้ำ (ค่าเริ่มต้นคือโฮสต์ Graph และ Bot Framework)
- `channels.msteams.graphMediaFallback`: เลือกใช้การค้นหาข้อความผ่าน Graph เมื่อ HTML ของช่องทาง/กลุ่มไม่มีเครื่องหมายระบุไฟล์ (ค่าเริ่มต้นคือ `false`; ดู [การกู้คืนไฟล์ของช่องทาง/กลุ่ม](#channelgroup-file-recovery-graphmediafallback))
- `channels.msteams.mediaMaxMb`: ค่าจำกัดขนาดสื่อรายช่องทางที่เขียนทับได้ในหน่วย MB หากไม่ได้ตั้งค่า จะใช้ `agents.defaults.mediaMaxMb`
- `channels.msteams.requireMention`: กำหนดให้ต้อง @mention ในช่องทาง/กลุ่ม (ค่าเริ่มต้นคือ `true`)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: ค่าที่เขียนทับได้รายทีม
- `channels.msteams.teams.<teamId>.requireMention`: ค่าที่เขียนทับได้รายทีม
- `channels.msteams.teams.<teamId>.tools`: ค่าที่เขียนทับนโยบายเครื่องมือเริ่มต้นรายทีม (`allow`/`deny`/`alsoAllow`) ซึ่งใช้เมื่อไม่มีค่าที่เขียนทับสำหรับช่องทาง
- `channels.msteams.teams.<teamId>.toolsBySender`: ค่าที่เขียนทับนโยบายเครื่องมือเริ่มต้นรายทีมและรายผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ค่าที่เขียนทับได้รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ค่าที่เขียนทับได้รายช่องทาง
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: ค่าที่เขียนทับนโยบายเครื่องมือรายช่องทาง (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: ค่าที่เขียนทับนโยบายเครื่องมือรายช่องทางและรายผู้ส่ง (รองรับไวลด์การ์ด `"*"`)
- คีย์ `toolsBySender` ควรใช้คำนำหน้าที่ชัดเจน ได้แก่ `channel:`, `id:`, `e164:`, `username:`, `name:` (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปไปยัง `id:` เท่านั้น)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน - `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ใบรับรอง PEM (การยืนยันตัวตนแบบสหพันธรัฐและใบรับรอง)
- `channels.msteams.certificateThumbprint`: ลายนิ้วมือใบรับรอง; ระบบยอมรับค่าได้แต่ไม่จำเป็นต่อการยืนยันตัวตน
- `channels.msteams.useManagedIdentity`: เปิดใช้การยืนยันตัวตนด้วยข้อมูลประจำตัวที่มีการจัดการ (โหมดสหพันธรัฐ)
- `channels.msteams.managedIdentityClientId`: ID ไคลเอนต์สำหรับข้อมูลประจำตัวที่มีการจัดการซึ่งผู้ใช้กำหนด
- `channels.msteams.sharePointSiteId`: ID ไซต์ SharePoint สำหรับอัปโหลดไฟล์ในแชตกลุ่ม/ช่องทาง (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card ต้อนรับที่แสดงเมื่อมีการติดต่อทาง DM/กลุ่มครั้งแรก และปุ่มพรอมต์ที่แนะนำ
- `channels.msteams.responsePrefix`: ข้อความที่เติมนำหน้าการตอบกลับขาออก
- `channels.msteams.feedbackEnabled` (ค่าเริ่มต้นคือ `true`), `channels.msteams.feedbackReflection` (ค่าเริ่มต้นคือ `true`), `channels.msteams.feedbackReflectionCooldownMs`: ความคิดเห็นแบบยกนิ้วขึ้น/ลงต่อการตอบกลับ และการติดตามผลเพื่อทบทวนความคิดเห็นเชิงลบ
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: การเชื่อมต่อ OAuth ของ Bot Framework และขอบเขต Graph แบบมอบสิทธิ์สำหรับโฟลว์ที่อาศัย SSO; `sso.enabled: true` ต้องใช้ `sso.connectionName`

## การกำหนดเส้นทางและเซสชัน

- คีย์เซสชันเป็นไปตามรูปแบบมาตรฐานของเอเจนต์ (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความโดยตรงใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความช่องทาง/กลุ่มใช้ ID การสนทนา:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: เธรดเทียบกับโพสต์

Teams มี UI ช่องทางสองรูปแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                    | คำอธิบาย                                               | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (คลาสสิก)      | ข้อความปรากฏเป็นการ์ดโดยมีการตอบกลับแบบเธรดอยู่ด้านล่าง | `thread` (ค่าเริ่มต้น)       |
| **Threads** (คล้าย Slack) | ข้อความเรียงต่อกันเป็นเส้นตรง คล้าย Slack มากกว่า                   | `top-level`              |

**ปัญหา:** API ของ Teams ไม่เปิดเผยว่าช่องทางใช้ UI รูปแบบใด หากใช้ `replyStyle` ผิด:

- `thread` ในช่องทางรูปแบบ Threads → การตอบกลับซ้อนกันอย่างไม่เป็นธรรมชาติ
- `top-level` ในช่องทางรูปแบบ Posts → การตอบกลับปรากฏเป็นโพสต์ระดับบนสุดแยกต่างหากแทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนดค่า `replyStyle` แยกตามช่องทางโดยอิงจากวิธีตั้งค่าช่องทาง:

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

เมื่อบอตส่งการตอบกลับไปยังช่องทาง ระบบจะกำหนด `replyStyle` จากค่าที่เขียนทับซึ่งเฉพาะเจาะจงที่สุดไล่ลงไปถึงค่าเริ่มต้น โดยใช้ค่าแรกที่ไม่ใช่ `undefined`:

1. **รายช่องทาง** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **รายทีม** - `channels.msteams.teams.<teamId>.replyStyle`
3. **ส่วนกลาง** - `channels.msteams.replyStyle`
4. **ค่าเริ่มต้นโดยนัย** - คำนวณจาก `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

หากตั้งค่า `requireMention: false` ส่วนกลางโดยไม่มี `replyStyle` ที่ระบุชัดเจน การกล่าวถึงในช่องทางรูปแบบ Posts จะปรากฏเป็นโพสต์ระดับบนสุด แม้ว่าข้อความขาเข้าจะเป็นการตอบกลับในเธรดก็ตาม ให้ตรึง `replyStyle: "thread"` ไว้ที่ระดับส่วนกลาง ทีม หรือช่องทางเพื่อหลีกเลี่ยงผลลัพธ์ที่ไม่คาดคิด

สำหรับการส่งเชิงรุกไปยังการสนทนาของช่องทางที่จัดเก็บไว้ (การตอบกลับจากการเรียกใช้เครื่องมือที่เข้าคิว เอเจนต์ที่ทำงานเป็นเวลานาน) จะใช้การกำหนดค่าระดับทีม/ช่องทางแบบเดียวกัน ส่วนแชตกลุ่มและการสนทนาส่วนตัว (DM) จะกำหนดเป็น `top-level` เสมอสำหรับการส่งเชิงรุก โดยไม่ขึ้นกับ `replyStyle`

### การรักษาบริบทของเธรด

เมื่อ `replyStyle: "thread"` มีผลและบอตถูก @mention จากภายในเธรดของช่องทาง OpenClaw จะแนบรากของเธรดเดิมกลับไปยังการอ้างอิงการสนทนาขาออก (`19:...@thread.tacv2;messageid=<root>`) เพื่อให้การตอบกลับอยู่ในเธรดเดียวกัน ซึ่งใช้ได้ทั้งการส่งแบบสด (ภายในรอบการทำงาน) และการส่งเชิงรุกหลังจากบริบทรอบการทำงานของ Bot Framework หมดอายุแล้ว (เช่น เอเจนต์ที่ทำงานเป็นเวลานาน การตอบกลับจากการเรียกใช้เครื่องมือที่เข้าคิวผ่าน `mcp__openclaw__message`)

รากของเธรดมาจาก `threadId` ที่จัดเก็บไว้ในการอ้างอิงการสนทนา การอ้างอิงเก่าที่จัดเก็บไว้ก่อนมี `threadId` จะย้อนกลับไปใช้ `activityId` (กิจกรรมขาเข้าใดก็ตามที่ใช้เริ่มต้นการสนทนาครั้งล่าสุด) ดังนั้นการติดตั้งใช้งานที่มีอยู่จึงยังทำงานต่อได้โดยไม่ต้องเริ่มต้นข้อมูลใหม่

เมื่อ `replyStyle: "top-level"` มีผล ระบบจะตั้งใจตอบข้อความขาเข้าจากเธรดของช่องทางเป็นโพสต์ระดับบนสุดใหม่ โดยไม่แนบส่วนต่อท้ายของเธรด ลักษณะนี้ถูกต้องสำหรับช่องทางรูปแบบ Threads หากพบโพสต์ระดับบนสุดในจุดที่คาดว่าจะเป็นการตอบกลับในเธรด แสดงว่า `replyStyle` ถูกตั้งค่าไม่ถูกต้องสำหรับช่องทางนั้น

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DM:** รูปภาพและไฟล์แนบทำงานผ่าน API ไฟล์ของบอต Teams
- **ช่องทาง/กลุ่ม:** ไฟล์แนบอยู่ในพื้นที่จัดเก็บ M365 (SharePoint/OneDrive) เพย์โหลด Webhook มีเพียงโครง HTML ไม่ใช่ไบต์ของไฟล์จริง **ต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่องทาง
- สำหรับการส่งที่ให้ไฟล์มาก่อนอย่างชัดเจน ให้ใช้ `action=upload-file` ร่วมกับ `media` / `filePath` / `path`; `message` ซึ่งระบุหรือไม่ก็ได้จะกลายเป็นข้อความ/ความคิดเห็นที่ส่งร่วม และ `filename` (หรือ `title`) จะเขียนทับชื่อไฟล์ที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความช่องทางที่มีรูปภาพจะมาถึงในรูปแบบข้อความเท่านั้น (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
ตามค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจากชื่อโฮสต์ Microsoft/Teams เท่านั้น เขียนทับได้ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
ระบบจะแนบส่วนหัว Authorization เฉพาะสำหรับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นคือโฮสต์ Graph และ Bot Framework) ควรกำหนดรายการนี้อย่างเข้มงวด (หลีกเลี่ยงส่วนต่อท้ายแบบหลายผู้เช่า)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ใน DM โดยใช้โฟลว์ FileConsentCard ที่มีมาให้ **การส่งไฟล์ในแชตกลุ่ม/ช่องทาง** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                  | วิธีส่งไฟล์                           | การตั้งค่าที่จำเป็น                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม                            |
| **แชตกลุ่ม/ช่องทาง** | อัปโหลดไปยัง SharePoint → การ์ดไฟล์แบบเนทีฟ      | ต้องใช้ `sharePointSiteId` และสิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | ฝังแบบเข้ารหัส Base64                        | ใช้งานได้ทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม                            |

### เหตุผลที่แชตกลุ่มต้องใช้ SharePoint

บอตใช้ข้อมูลประจำตัวของแอปพลิเคชัน ขณะที่ทรัพยากร `/me` ของ Microsoft Graph [กำหนดให้ต้องมีผู้ใช้ที่ลงชื่อเข้าใช้](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0) ในการส่งไฟล์ในแชตกลุ่ม/ช่องทาง บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์สำหรับแชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `ChatMember.Read.All` (Application) - สิทธิ์ทั่วทั้งผู้เช่าที่มีสิทธิ์ขั้นต่ำสำหรับการส่งไฟล์ในแชตกลุ่ม `Chat.Read.All` ก็ใช้งานได้เช่นกันและครอบคลุมกรณีนี้อยู่แล้วเมื่อเปิดใช้ประวัติแชตกลุ่ม อีกทางเลือกหนึ่งสำหรับแต่ละแชตคือใช้ [สิทธิ์ความยินยอมเฉพาะทรัพยากร](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`
2. **ให้ความยินยอมของผู้ดูแลระบบ** สำหรับผู้เช่า
3. **รับ ID ไซต์ SharePoint ของคุณ:**

   ```bash
   # ผ่าน Graph Explorer หรือ curl ด้วยโทเค็นที่ถูกต้อง:
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

| บริบทและสิทธิ์                                                         | ลักษณะการแชร์                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| ช่อง + `Sites.ReadWrite.All`                                               | ลิงก์แชร์ทั่วทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้)                 |
| แชตกลุ่ม + `Sites.ReadWrite.All` + สิทธิ์อ่านสมาชิกแชตที่รองรับ            | ลิงก์แชร์รายผู้ใช้ (เฉพาะสมาชิกแชตเท่านั้นที่เข้าถึงได้)          |
| แชตกลุ่มที่ไม่มีสิทธิ์อ่านสมาชิกแชตที่รองรับ                            | การส่งล้มเหลวแบบปิดกั้น                                          |

การแชร์รายผู้ใช้มีความปลอดภัยมากกว่า เนื่องจากมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ OpenClaw กำหนดให้การค้นหาสมาชิกสำหรับแชตกลุ่มต้องสำเร็จ หากหมดเวลา การรับส่งล้มเหลว ผลลัพธ์ว่างเปล่า หรือ Graph API ปฏิเสธ ระบบจะไม่ส่งข้อความแทนที่จะขยายสิทธิ์เข้าถึงไปยังทั้งองค์กร

### ลักษณะการสำรอง

| สถานการณ์                                                         | ผลลัพธ์                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนดค่าสิทธิ์ SharePoint และสมาชิกแล้ว          | อัปโหลดไปยัง SharePoint แล้วส่งการ์ดไฟล์แบบเนทีฟ      |
| แชตกลุ่ม + ไฟล์ + ไม่มีสิทธิ์ SharePoint หรือสมาชิก                | ล้มเหลวพร้อมข้อผิดพลาดการกำหนดค่าที่ระบุวิธีแก้ไขได้  |
| ช่อง + ไฟล์ + กำหนดค่า `sharePointSiteId` แล้ว                     | อัปโหลดไปยัง SharePoint แล้วส่งการ์ดไฟล์แบบเนทีฟ      |
| แชตส่วนตัว + ไฟล์                                                  | โฟลว์ FileConsentCard (ทำงานโดยไม่ต้องใช้ SharePoint) |
| บริบทใดๆ + รูปภาพ                                                  | แบบอินไลน์ที่เข้ารหัส Base64 (ทำงานโดยไม่ต้องใช้ SharePoint) |

### ตำแหน่งจัดเก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกจัดเก็บในโฟลเดอร์ `/OpenClawShared/` ภายในไลบรารีเอกสารเริ่มต้นของไซต์ SharePoint ที่กำหนดค่าไว้

## แบบสำรวจ (Adaptive Cards)

OpenClaw ส่งแบบสำรวจของ Teams เป็น Adaptive Cards (ไม่มี API แบบสำรวจแบบเนทีฟของ Teams)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`
- Gateway บันทึกคะแนนโหวตไว้ใน SQLite สถานะ Plugin ของ OpenClaw ภายใต้ `state/openclaw.sqlite`
- ไฟล์ `msteams-polls.json` ที่มีอยู่จะถูกนำเข้าโดย `openclaw doctor --fix` ไม่ใช่โดย Plugin ที่กำลังทำงาน
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- แบบสำรวจจะไม่โพสต์สรุปผลโดยอัตโนมัติ และขณะนี้ยังไม่มี CLI สำหรับผลแบบสำรวจ

## การ์ดนำเสนอ

ส่งเพย์โหลดการนำเสนอเชิงความหมายไปยังผู้ใช้หรือการสนทนาใน Teams โดยใช้เครื่องมือ `message`, CLI หรือการส่งการตอบกลับตามปกติ OpenClaw เรนเดอร์เพย์โหลดเหล่านี้เป็น Teams Adaptive Cards จากสัญญาการนำเสนอทั่วไป

พารามิเตอร์ `presentation` รับบล็อกเชิงความหมาย เมื่อระบุ `presentation` ข้อความจะเป็นตัวเลือก ปุ่มจะเรนเดอร์เป็นการดำเนินการส่งข้อมูลหรือ URL ของ Adaptive Card เมนูเลือกไม่ใช่รูปแบบเนทีฟในตัวเรนเดอร์ของ Teams ดังนั้น OpenClaw จะแปลงเป็นข้อความที่อ่านได้ก่อนส่ง

**เครื่องมือ Agent:**

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

เป้าหมาย MSTeams ใช้คำนำหน้าเพื่อแยกระหว่างผู้ใช้กับการสนทนา:

| ประเภทเป้าหมาย       | รูปแบบ                           | ตัวอย่าง                                                                                                |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ผู้ใช้ (ตาม ID)      | `user:<aad-object-id>`               | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                     |
| ผู้ใช้ (ตามชื่อ)     | `user:<display-name>`               | `user:John Smith` (ต้องใช้ Graph API)                                                                 |
| กลุ่ม/ช่อง           | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                     |
| กลุ่ม/ช่อง (แบบดิบ) | `<conversation-id>`               | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` หรือ Bot Framework id แบบเปล่าที่เป็น `a:`/`8:orgid:`/`29:` |

**ตัวอย่าง CLI:**

```bash
# ส่งถึงผู้ใช้ตาม ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "สวัสดี"

# ส่งถึงผู้ใช้ตามชื่อที่แสดง (เรียกใช้การค้นหาด้วย Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "สวัสดี"

# ส่งไปยังแชตกลุ่มหรือช่อง
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "สวัสดี"

# ส่งการ์ดนำเสนอไปยังการสนทนา
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"สวัสดี","blocks":[{"type":"text","text":"สวัสดี"}]}'
```

**ตัวอย่างเครื่องมือ Agent:**

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
หากไม่มีคำนำหน้า `user:` ระบบจะค้นหาชื่อเป็นกลุ่มหรือทีมโดยค่าเริ่มต้น ใช้ `user:` เสมอเมื่อกำหนดเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง
</Note>

## การส่งข้อความเชิงรุก

- สามารถส่งข้อความเชิงรุกได้ **หลังจาก** ผู้ใช้โต้ตอบแล้วเท่านั้น เนื่องจาก OpenClaw จะจัดเก็บการอ้างอิงการสนทนา ณ จุดนั้น
- ดู `dmPolicy` และการควบคุมด้วยรายการอนุญาตที่ [/gateway/configuration](/th/gateway/configuration)

## ID ของทีมและช่อง (ข้อผิดพลาดที่พบบ่อย)

พารามิเตอร์การค้นหา `groupId` ใน URL ของ Teams **ไม่ใช่** ID ทีมที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จากพาธของ URL แทน:

**URL ของทีม:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID การสนทนาของทีม (ถอดรหัส URL ค่านี้)
```

**URL ของช่อง:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID ช่อง (ถอดรหัส URL ค่านี้)
```

**สำหรับการกำหนดค่า:**

- คีย์ทีม = ส่วนของพาธหลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`; ผู้เช่ารุ่นเก่าอาจแสดง `@thread.skype` ซึ่งใช้ได้เช่นกัน)
- คีย์ช่อง = ส่วนของพาธหลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ไม่ต้องสนใจ** พารามิเตอร์การค้นหา `groupId` สำหรับการกำหนดเส้นทางของ OpenClaw ค่านี้คือ ID กลุ่ม Microsoft Entra ไม่ใช่ ID การสนทนา Bot Framework ที่ใช้ในกิจกรรม Teams ขาเข้า

## ช่องส่วนตัว

บอตรองรับช่องส่วนตัวอย่างจำกัด:

| คุณสมบัติ                         | ช่องมาตรฐาน | ช่องส่วนตัว                |
| --------------------------------- | ----------- | -------------------------- |
| การติดตั้งบอต                     | ได้         | จำกัด                      |
| ข้อความแบบเรียลไทม์ (Webhook)    | ได้         | อาจไม่ทำงาน                |
| สิทธิ์ RSC                        | ได้         | อาจทำงานแตกต่างออกไป       |
| @mentions                         | ได้         | หากเข้าถึงบอตได้            |
| ประวัติ Graph API                 | ได้         | ได้ (เมื่อมีสิทธิ์)         |

**วิธีแก้ปัญหาชั่วคราวหากช่องส่วนตัวไม่ทำงาน:**

1. ใช้ช่องมาตรฐานสำหรับการโต้ตอบกับบอต
2. ใช้ DM ผู้ใช้สามารถส่งข้อความถึงบอตโดยตรงได้เสมอ
3. ใช้ Graph API เพื่อเข้าถึงประวัติ (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในช่อง:** ไม่มีสิทธิ์ Graph หรือความยินยอมจากผู้ดูแลระบบ ติดตั้งแอป Teams ใหม่ จากนั้นปิด Teams โดยสมบูรณ์แล้วเปิดอีกครั้ง
- **ไม่มีการตอบกลับในช่อง:** โดยค่าเริ่มต้นต้องมีการกล่าวถึง ให้ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าแยกตามทีม/ช่อง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดงไฟล์ manifest เก่า):** นำแอปออกแล้วเพิ่มใหม่ และปิด Teams โดยสมบูรณ์เพื่อรีเฟรช
- **401 Unauthorized จาก Webhook:** เป็นพฤติกรรมที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT หมายความว่าสามารถเข้าถึงปลายทางได้แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลดไฟล์ manifest

- **"Icon file cannot be empty":** ไฟล์ manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ สร้างไอคอน PNG ที่ถูกต้อง (32x32 สำหรับ `outline.png`, 192x192 สำหรับ `color.png`)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชตอื่น ให้ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การเปลี่ยนแปลงเผยแพร่
- **"Something went wrong" ระหว่างอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบเนื้อหาการตอบกลับเพื่อดูข้อผิดพลาดจริง
- **การโหลดจากภายนอกล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" วิธีนี้มักข้ามข้อจำกัดการโหลดจากภายนอกได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตทุกประการ
2. อัปโหลดแอปใหม่และติดตั้งอีกครั้งในทีม/แชต
3. ตรวจสอบว่าผู้ดูแลระบบขององค์กรบล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าใช้ขอบเขตที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม และ `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## เอกสารอ้างอิง

- [สร้าง Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [สคีมาไฟล์ manifest ของแอป Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [รับข้อความช่องด้วย RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [เอกสารอ้างอิงสิทธิ์ RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [การจัดการไฟล์ของบอต Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (ช่อง/กลุ่มต้องใช้ Graph)
- [การส่งข้อความเชิงรุก](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI สำหรับจัดการบอต

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนผ่านข้อความส่วนตัวและขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) - ลักษณะการทำงานของแชตกลุ่มและการจำกัดด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - รูปแบบการเข้าถึงและการเสริมความมั่นคงปลอดภัย
