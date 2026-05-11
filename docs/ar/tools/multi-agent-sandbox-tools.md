---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: صندوق العزل + قيود الأدوات لكل وكيل، والأسبقية، والأمثلة
title: بيئة معزولة وأدوات متعددة الوكلاء
x-i18n:
    generated_at: "2026-05-11T20:42:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Each agent in a multi-agent setup can override the global sandbox and tool policy. This page covers per-agent configuration, precedence rules, and examples.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/ar/gateway/sandboxing">
    Backends and modes — full sandbox reference.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug "why is this blocked?"
  </Card>
  <Card title="Elevated mode" href="/ar/tools/elevated">
    Elevated exec for trusted senders.
  </Card>
</CardGroup>

<Warning>
Auth is scoped by agent: each agent has its own `agentDir` auth store at `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Never reuse `agentDir` across agents. Agents can read through to the default/main agent's auth profiles when they do not have a local profile, but OAuth refresh tokens are not cloned into secondary agent stores. If you copy credentials manually, copy only portable static `api_key` or `token` profiles.
</Warning>

---

## Configuration examples

<AccordionGroup>
  <Accordion title="Example 1: Personal + restricted family agent">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **Result:**

    - `main` agent: runs on host, full tool access.
    - `family` agent: runs in Docker (one container per agent), only `read` and current-conversation message sends.

  </Accordion>
  <Accordion title="Example 2: Work agent with shared sandbox">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="Example 2b: Global coding profile + messaging-only agent">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **Result:**

    - default agents get coding tools.
    - `support` agent is messaging-only (+ Slack tool).

  </Accordion>
  <Accordion title="Example 3: Different sandbox modes per agent">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## Configuration precedence

When both global (`agents.defaults.*`) and agent-specific (`agents.list[].*`) configs exist:

### Sandbox config

Agent-specific settings override global:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` overrides `agents.defaults.sandbox.{docker,browser,prune}.*` for that agent (ignored when sandbox scope resolves to `"shared"`).
</Note>

### Tool restrictions

The filtering order is:

<Steps>
  <Step title="Tool profile">
    `tools.profile` or `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider tool profile">
    `tools.byProvider[provider].profile` or `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Global tool policy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider tool policy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent-specific tool policy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent provider policy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool policy">
    `tools.sandbox.tools` or `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent tool policy">
    `tools.subagents.tools`, if applicable.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - Each level can further restrict tools, but cannot grant back denied tools from earlier levels.
    - If `agents.list[].tools.sandbox.tools` is set, it replaces `tools.sandbox.tools` for that agent.
    - If `agents.list[].tools.profile` is set, it overrides `tools.profile` for that agent.
    - Provider tool keys accept either `provider` (e.g. `google-antigravity`) or `provider/model` (e.g. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    If any explicit allowlist in that chain leaves the run with no callable tools, OpenClaw stops before submitting the prompt to the model. This is intentional: an agent configured with a missing tool such as `agents.list[].tools.allow: ["query_db"]` should fail loudly until the plugin that registers `query_db` is enabled, not continue as a text-only agent.
  </Accordion>
</AccordionGroup>

Tool policies support `group:*` shorthands that expand to multiple tools. See [Tool groups](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) for the full list.

Per-agent elevated overrides (`agents.list[].tools.elevated`) can further restrict elevated exec for specific agents. See [Elevated mode](/ar/tools/elevated) for details.

---

## الترحيل من وكيل واحد

<Tabs>
  <Tab title="قبل (وكيل واحد)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="بعد (وكلاء متعددون)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
تُرحَّل إعدادات `agent.*` القديمة بواسطة `openclaw doctor`؛ ويفضَّل استخدام `agents.defaults` + `agents.list` من الآن فصاعدًا.
</Note>

---

## أمثلة تقييد الأدوات

<Tabs>
  <Tab title="وكيل للقراءة فقط">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="تنفيذ Shell مع تعطيل أدوات نظام الملفات">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    تُعطّل هذه السياسة أدوات نظام الملفات في OpenClaw، لكن `exec` يظل Shell ويمكنه كتابة الملفات حيثما يسمح المضيف المحدد أو نظام ملفات صندوق العزل. للحصول على وكيل للقراءة فقط، امنع `exec` و`process`، أو ادمج الوصول إلى Shell مع عناصر التحكم في نظام ملفات صندوق العزل مثل `agents.defaults.sandbox.workspaceAccess: "ro"` أو `"none"`.
    </Warning>

  </Tab>
  <Tab title="الاتصال فقط">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    لا يزال `sessions_history` في هذا الملف الشخصي يعيد عرض استدعاء محدودًا ومنقحًا بدلًا من تفريغ نصي خام. يزيل استدعاء المساعد وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات بنص عادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المقتطعة)، وبنية استدعاءات الأدوات المخفّضة، ورموز تحكم النموذج المسرّبة بنمط ASCII/العرض الكامل، وXML استدعاءات أدوات MiniMax غير الصالح قبل التنقيح/الاقتطاع.

  </Tab>
</Tabs>

---

## خطأ شائع: "non-main"

<Warning>
يعتمد `agents.defaults.sandbox.mode: "non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرّف الوكيل. تحصل جلسات المجموعة/القناة دائمًا على مفاتيحها الخاصة، لذلك تُعامل على أنها غير رئيسية وسيُطبّق عليها صندوق العزل. إذا أردت ألا يستخدم وكيل صندوق العزل أبدًا، فاضبط `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## الاختبار

بعد تكوين صندوق العزل والأدوات للوكلاء المتعددين:

<Steps>
  <Step title="تحقق من حلّ الوكيل">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="تحقق من حاويات صندوق العزل">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="اختبر قيود الأدوات">
    - أرسل رسالة تتطلب أدوات مقيدة.
    - تحقق من أن الوكيل لا يستطيع استخدام الأدوات الممنوعة.

  </Step>
  <Step title="راقب السجلات">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكيل غير موضوع في صندوق العزل رغم `mode: 'all'`">
    - تحقق مما إذا كان هناك `agents.defaults.sandbox.mode` عام يتجاوزه.
    - تكون للإعدادات الخاصة بالوكيل الأولوية، لذلك اضبط `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="الأدوات لا تزال متاحة رغم قائمة المنع">
    - تحقق من ترتيب تصفية الأدوات: عام → وكيل → صندوق عزل → وكيل فرعي.
    - يمكن لكل مستوى أن يزيد التقييد فقط، ولا يمكنه إعادة المنح.
    - تحقق من ذلك عبر السجلات: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="الحاوية غير معزولة لكل وكيل">
    - اضبط `scope: "agent"` في تكوين صندوق العزل الخاص بالوكيل.
    - الافتراضي هو `"session"`، وهو ما ينشئ حاوية واحدة لكل جلسة.

  </Accordion>
</AccordionGroup>

---

## ذات صلة

- [وضع الامتيازات المرتفعة](/ar/tools/elevated)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [تكوين بيئة العزل](/ar/gateway/config-agents#agentsdefaultssandbox)
- [بيئة العزل مقابل سياسة الأدوات مقابل الامتيازات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح أخطاء "لماذا تم حظر هذا؟"
- [العزل](/ar/gateway/sandboxing) — مرجع بيئة العزل الكامل (الأوضاع، النطاقات، الخلفيات، الصور)
- [إدارة الجلسات](/ar/concepts/session)
