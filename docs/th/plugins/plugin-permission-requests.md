---
read_when:
    - คุณต้องมีฮุกหรือเครื่องมือของ Plugin เพื่อถามก่อนที่การดำเนินการที่มีผลข้างเคียงจะเกิดขึ้น
    - คุณต้องกำหนดค่าว่าจะส่งพรอมป์ขออนุมัติของ Plugin ไปที่ใด
    - คุณกำลังตัดสินใจระหว่างเครื่องมือเสริม การอนุมัติ exec และการอนุมัติ Plugin
sidebarTitle: Permission requests
summary: ขอให้ผู้ใช้อนุมัติการเรียกใช้เครื่องมือของ Plugin และพรอมต์สิทธิ์ที่ Plugin เป็นเจ้าของ
title: คำขอสิทธิ์ของ Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

คำขอสิทธิ์ของ Plugin ช่วยให้โค้ด Plugin หยุดพักการเรียกเครื่องมือหรือการดำเนินการที่ Plugin เป็นเจ้าของไว้จนกว่าผู้ใช้จะอนุมัติหรือปฏิเสธได้ โดยใช้โฟลว์ `plugin.approval.*` ของ Gateway และพื้นผิว UI การอนุมัติเดียวกันกับที่จัดการปุ่มอนุมัติในแชตและคำสั่ง `/approve`

ใช้คำขอสิทธิ์ของ Plugin สำหรับสิทธิ์ของ Plugin/แอป คำขอเหล่านี้ไม่ได้แทนที่การอนุมัติ host exec, allowlist เครื่องมือเสริม หรือการตรวจสอบสิทธิ์แบบเนทีฟของ Codex

## เลือก gate ที่ถูกต้อง

เลือก gate ที่ตรงกับจุดตัดสินใจที่คุณต้องใช้:

| Gate                             | ใช้เมื่อ                                                                  | สิ่งที่ควบคุม                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| เครื่องมือเสริม                  | เครื่องมือไม่ควรมองเห็นได้สำหรับโมเดลจนกว่าผู้ใช้จะเลือกใช้             | การเปิดเผยเครื่องมือผ่าน `tools.allow`                                                                                     |
| คำขอสิทธิ์ของ Plugin             | Hook ของ Plugin หรือการดำเนินการที่ Plugin เป็นเจ้าของต้องถามก่อนรันหนึ่งการกระทำ | การอนุมัติขณะรันผ่าน `plugin.approval.*`                                                                                   |
| การอนุมัติ exec                  | คำสั่งของโฮสต์หรือเครื่องมือคล้ายเชลล์ต้องได้รับการอนุมัติจากผู้ปฏิบัติงาน | นโยบาย host exec และ allowlist exec แบบคงทน                                                                                |
| คำขอสิทธิ์แบบเนทีฟของ Codex      | Codex ถามก่อนการกระทำเชลล์ ไฟล์ MCP หรือ app-server แบบเนทีฟ              | การจัดการการอนุมัติ app-server หรือ hook แบบเนทีฟของ Codex ซึ่ง route ผ่านการอนุมัติ Plugin เมื่อ OpenClaw เป็นเจ้าของ prompt |
| การร้องขอการอนุมัติของ MCP       | เซิร์ฟเวอร์ MCP ของ Codex ขอการอนุมัติสำหรับการเรียกเครื่องมือ           | การตอบกลับการอนุมัติ MCP ที่ bridge ผ่านการอนุมัติ Plugin ของ OpenClaw                                                     |

เครื่องมือเสริมเป็น gate ณ เวลาค้นพบ คำขอสิทธิ์ของ Plugin เป็น gate รายการเรียก ใช้ทั้งสองอย่างเมื่อเครื่องมือที่ละเอียดอ่อนควรต้องมีการเลือกใช้แบบชัดเจนก่อนที่โมเดลจะเห็นได้ และต้องมีการอนุมัติก่อนที่การกระทำจะรัน

## ขอการอนุมัติก่อนการเรียกเครื่องมือ

Prompt ส่วนใหญ่ที่เขียนโดย Plugin ควรเริ่มใน hook `before_tool_call` Hook จะรันหลังจากโมเดลเลือกเครื่องมือและก่อนที่ OpenClaw จะดำเนินการ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

เขียนข้อความ prompt สำหรับคนที่จะอนุมัติการกระทำนั้น:

- ทำให้ `title` สั้นและเน้นการกระทำ Gateway รับได้สูงสุด 80 อักขระ
- ทำให้ `description` เฉพาะเจาะจงและมีขอบเขต Gateway รับได้สูงสุด 256 อักขระ
- ใส่การกระทำ เป้าหมาย และความเสี่ยง อย่าใส่ความลับ token หรือ payload ส่วนตัวที่ไม่ควรปรากฏในพื้นผิวการอนุมัติของแชต
- ใช้ `severity: "critical"` เฉพาะกับการกระทำที่การตัดสินใจผิดพลาดอาจทำให้ production เสียหายหรือข้อมูลสูญหาย
- ใช้ `allowedDecisions: ["allow-once", "deny"]` เมื่อความไว้วางใจแบบถาวรไม่ปลอดภัยสำหรับการกระทำนั้น

## พฤติกรรมการตัดสินใจ

OpenClaw จะสร้างการอนุมัติที่ค้างอยู่ด้วย ID แบบ `plugin:` ส่งไปยังพื้นผิวการอนุมัติที่พร้อมใช้งาน และรอการตัดสินใจ

| การตัดสินใจ      | ผลลัพธ์                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | การเรียกปัจจุบันดำเนินต่อ                                               |
| `allow-always`    | การเรียกปัจจุบันดำเนินต่อ และส่งการตัดสินใจให้ Plugin                   |
| `deny`            | การเรียกถูกบล็อกด้วยผลลัพธ์เครื่องมือที่ถูกปฏิเสธ                       |
| Timeout           | การเรียกถูกบล็อก เว้นแต่ `timeoutBehavior` เป็น `"allow"`                |
| การยกเลิก         | การเรียกถูกบล็อกเมื่อ run ถูก abort                                      |
| ไม่มี route การอนุมัติ | การเรียกถูกบล็อกเพราะไม่มีพื้นผิวการอนุมัติที่เชื่อมต่ออยู่สามารถ resolve ได้ |

`allow-always` จะคงทนก็ต่อเมื่อ Plugin หรือ runtime ที่ส่งคำขอนั้น implement การคงอยู่ดังกล่าว สำหรับ hook `before_tool_call.requireApproval` ทั่วไป OpenClaw จะถือว่า `allow-once` และ `allow-always` เป็นการตัดสินใจอนุมัติสำหรับการเรียกปัจจุบัน และส่งค่าที่ resolve แล้วไปยัง `onResolution` หาก Plugin ของคุณเสนอ `allow-always` ให้จัดทำเอกสารและ implement อย่างชัดเจนว่าการเรียกในอนาคตใดที่เชื่อถือได้

หาก hook ส่งคืน `params` ด้วย OpenClaw จะใช้การเปลี่ยนแปลงพารามิเตอร์เหล่านั้นหลังจากการอนุมัติสำเร็จเท่านั้น hook ที่มีลำดับความสำคัญต่ำกว่ายังสามารถบล็อกได้หลังจาก hook ที่มีลำดับความสำคัญสูงกว่าขอการอนุมัติแล้ว

`allowedDecisions` จำกัดปุ่มและคำสั่งที่แสดงต่อผู้ใช้ Gateway จะปฏิเสธความพยายาม resolve สำหรับการตัดสินใจใดๆ ที่คำขอไม่ได้เสนอไว้

## Route prompt การอนุมัติ

Prompt การอนุมัติสามารถ resolve ได้ในพื้นผิว UI ภายในเครื่อง หรือในช่องทางแชตที่รองรับการจัดการการอนุมัติ หากต้องการส่งต่อ prompt การอนุมัติของ Plugin ไปยังเป้าหมายแชตแบบชัดเจน ให้กำหนดค่า `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` เป็นอิสระจาก `approvals.exec` การเปิดใช้การส่งต่อการอนุมัติ exec จะไม่ route prompt การอนุมัติของ Plugin และการเปิดใช้การส่งต่อการอนุมัติของ Plugin จะไม่เปลี่ยนนโยบาย host exec

เมื่อ prompt มีข้อความการอนุมัติแบบ manual ให้ resolve ด้วยหนึ่งในการตัดสินใจที่เสนอไว้:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

ดู [การอนุมัติ exec ขั้นสูง](/th/tools/exec-approvals-advanced#plugin-approval-forwarding) สำหรับโมเดลการส่งต่อทั้งหมด พฤติกรรมการอนุมัติในแชตเดียวกัน การส่งผ่านช่องทางแบบเนทีฟ และกฎผู้อนุมัติเฉพาะช่องทาง

## สิทธิ์แบบเนทีฟของ Codex

Prompt สิทธิ์แบบเนทีฟของ Codex สามารถเดินทางผ่านการอนุมัติ Plugin ได้เช่นกัน แต่มีความเป็นเจ้าของต่างจาก hook ที่เขียนโดย Plugin

- คำขออนุมัติ app-server ของ Codex จะ route ผ่าน OpenClaw หลังจากการตรวจสอบของ Codex
- Relay hook แบบเนทีฟ `permission_request` สามารถถามผ่าน `plugin.approval.request` เมื่อเปิดใช้ relay นั้น
- การร้องขอการอนุมัติเครื่องมือ MCP จะ route ผ่านการอนุมัติ Plugin เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น `"mcp_tool_call"`

ดู [Runtime ของ harness Codex](/th/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) สำหรับพฤติกรรมเฉพาะของ Codex และกฎ fallback

## การแก้ไขปัญหา

**เครื่องมือแจ้งว่าการอนุมัติ Plugin ไม่พร้อมใช้งาน** ไม่มี UI การอนุมัติหรือ route การอนุมัติที่กำหนดค่าไว้ยอมรับคำขอ เชื่อมต่อไคลเอนต์ที่รองรับการอนุมัติ ใช้ช่องทางที่รองรับ `/approve` ในแชตเดียวกัน หรือกำหนดค่า `approvals.plugin`

**`allow-always` ปรากฏ แต่การเรียกถัดไปยัง prompt อีกครั้ง** โฟลว์การอนุมัติ Plugin ทั่วไปไม่ได้คงความไว้วางใจสำหรับ hook ใดๆ โดยอัตโนมัติ ให้คงความไว้วางใจที่ Plugin เป็นเจ้าของไว้ใน Plugin ของคุณหลังจาก `onResolution("allow-always")` หรือเสนอเฉพาะ `allow-once` และ `deny`

**`/approve` ปฏิเสธการตัดสินใจ** คำขอจำกัด `allowedDecisions` ไว้ ใช้หนึ่งในการตัดสินใจที่พิมพ์อยู่ใน prompt

**Prompt ของ Slack, Discord, Telegram หรือ Matrix route ต่างจากการอนุมัติ exec** การอนุมัติ Plugin และการอนุมัติ exec ใช้ config แยกกัน และอาจใช้การตรวจสอบสิทธิ์ต่างกัน ตรวจสอบ `approvals.plugin` และการรองรับการอนุมัติ Plugin ของช่องทาง แทนที่จะตรวจสอบเฉพาะ `approvals.exec`

## ที่เกี่ยวข้อง

- [Hook ของ Plugin](/th/plugins/hooks#tool-call-policy)
- [การสร้าง Plugin](/th/plugins/building-plugins#registering-agent-tools)
- [การอนุมัติ exec ขั้นสูง](/th/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [โปรโตคอล Gateway](/th/gateway/protocol)
- [Runtime ของ harness Codex](/th/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
