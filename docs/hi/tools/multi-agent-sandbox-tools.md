---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: प्रति-एजेंट सैंडबॉक्स + टूल प्रतिबंध, वरीयता, और उदाहरण
title: बहु-एजेंट सैंडबॉक्स और टूल्स
x-i18n:
    generated_at: "2026-06-29T00:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

मल्टी-एजेंट सेटअप में हर एजेंट वैश्विक सैंडबॉक्स और टूल नीति को ओवरराइड कर सकता है। यह पेज प्रति-एजेंट कॉन्फ़िगरेशन, प्राथमिकता नियमों और उदाहरणों को कवर करता है।

<CardGroup cols={3}>
  <Card title="सैंडबॉक्सिंग" href="/hi/gateway/sandboxing">
    बैकएंड और मोड — पूरा सैंडबॉक्स संदर्भ।
  </Card>
  <Card title="सैंडबॉक्स बनाम टूल नीति बनाम उन्नत" href="/hi/gateway/sandbox-vs-tool-policy-vs-elevated">
    डिबग करें कि "यह क्यों ब्लॉक है?"
  </Card>
  <Card title="उन्नत मोड" href="/hi/tools/elevated">
    विश्वसनीय प्रेषकों के लिए उन्नत exec।
  </Card>
</CardGroup>

<Warning>
प्रमाणीकरण एजेंट के अनुसार scoped होता है: हर एजेंट का अपना `agentDir` auth store `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` पर होता है। एजेंटों के बीच `agentDir` का कभी पुनः उपयोग न करें। जब एजेंटों के पास स्थानीय प्रोफ़ाइल नहीं होती, तो वे डिफ़ॉल्ट/मुख्य एजेंट की auth profiles को पढ़ सकते हैं, लेकिन OAuth refresh tokens को द्वितीयक एजेंट स्टोर में क्लोन नहीं किया जाता। यदि आप credentials को मैन्युअल रूप से कॉपी करते हैं, तो केवल पोर्टेबल स्थिर `api_key` या `token` profiles कॉपी करें।
</Warning>

---

## कॉन्फ़िगरेशन उदाहरण

<AccordionGroup>
  <Accordion title="उदाहरण 1: व्यक्तिगत + प्रतिबंधित पारिवारिक एजेंट">
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

    **परिणाम:**

    - `main` एजेंट: होस्ट पर चलता है, पूरा टूल एक्सेस।
    - `family` एजेंट: Docker में चलता है (प्रति एजेंट एक container), केवल `read` और मौजूदा-बातचीत वाले संदेश भेजना।

  </Accordion>
  <Accordion title="उदाहरण 2: साझा सैंडबॉक्स वाला कार्य एजेंट">
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
  <Accordion title="उदाहरण 2b: वैश्विक coding profile + केवल-संदेश एजेंट">
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

    **परिणाम:**

    - डिफ़ॉल्ट एजेंटों को coding tools मिलते हैं।
    - `support` एजेंट केवल-संदेश है (+ Slack tool)।

  </Accordion>
  <Accordion title="उदाहरण 3: प्रति एजेंट अलग-अलग सैंडबॉक्स मोड">
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

## कॉन्फ़िगरेशन प्राथमिकता

जब वैश्विक (`agents.defaults.*`) और एजेंट-विशिष्ट (`agents.list[].*`) दोनों configs मौजूद हों:

### सैंडबॉक्स config

एजेंट-विशिष्ट सेटिंग्स वैश्विक को ओवरराइड करती हैं:

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
`agents.list[].sandbox.{docker,browser,prune}.*` उस एजेंट के लिए `agents.defaults.sandbox.{docker,browser,prune}.*` को ओवरराइड करता है (जब सैंडबॉक्स scope `"shared"` पर resolve होता है, तो इसे अनदेखा किया जाता है)।
</Note>

### टूल प्रतिबंध

फ़िल्टरिंग क्रम यह है:

<Steps>
  <Step title="टूल profile">
    `tools.profile` या `agents.list[].tools.profile`।
  </Step>
  <Step title="प्रदाता टूल profile">
    `tools.byProvider[provider].profile` या `agents.list[].tools.byProvider[provider].profile`।
  </Step>
  <Step title="वैश्विक टूल नीति">
    `tools.allow` / `tools.deny`।
  </Step>
  <Step title="प्रदाता टूल नीति">
    `tools.byProvider[provider].allow/deny`।
  </Step>
  <Step title="एजेंट-विशिष्ट टूल नीति">
    `agents.list[].tools.allow/deny`।
  </Step>
  <Step title="एजेंट प्रदाता नीति">
    `agents.list[].tools.byProvider[provider].allow/deny`।
  </Step>
  <Step title="सैंडबॉक्स टूल नीति">
    `tools.sandbox.tools` या `agents.list[].tools.sandbox.tools`।
  </Step>
  <Step title="उप-एजेंट टूल नीति">
    `tools.subagents.tools`, यदि लागू हो।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="प्राथमिकता नियम">
    - हर स्तर टूल्स को और प्रतिबंधित कर सकता है, लेकिन पहले के स्तरों से deny किए गए टूल्स को वापस grant नहीं कर सकता।
    - यदि `agents.list[].tools.sandbox.tools` सेट है, तो यह उस एजेंट के लिए `tools.sandbox.tools` को बदल देता है।
    - यदि `agents.list[].tools.profile` सेट है, तो यह उस एजेंट के लिए `tools.profile` को ओवरराइड करता है।
    - प्रदाता टूल keys या तो `provider` (जैसे `google-antigravity`) या `provider/model` (जैसे `openai/gpt-5.4`) स्वीकार करती हैं।

  </Accordion>
  <Accordion title="खाली अनुमति-सूची व्यवहार">
    यदि उस chain में कोई भी स्पष्ट अनुमति-सूची run को बिना callable tools के छोड़ देती है, तो OpenClaw prompt को model पर सबमिट करने से पहले रुक जाता है। यह जानबूझकर है: `agents.list[].tools.allow: ["query_db"]` जैसे missing tool के साथ configure किया गया एजेंट तब तक स्पष्ट रूप से fail होना चाहिए जब तक `query_db` register करने वाला Plugin enabled न हो, न कि text-only एजेंट के रूप में जारी रहे।
  </Accordion>
</AccordionGroup>

टूल नीतियां `group:*` shorthands का समर्थन करती हैं, जो कई टूल्स में expand होते हैं। पूरी सूची के लिए [टूल groups](/hi/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) देखें।

प्रति-एजेंट उन्नत overrides (`agents.list[].tools.elevated`) specific agents के लिए उन्नत exec को और प्रतिबंधित कर सकते हैं। विवरण के लिए [उन्नत मोड](/hi/tools/elevated) देखें।

---

## एकल एजेंट से माइग्रेशन

<Tabs>
  <Tab title="Before (single agent)">
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
  <Tab title="After (multi-agent)">
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
पुराने `agent.*` कॉन्फ़िगरेशन `openclaw doctor` द्वारा माइग्रेट किए जाते हैं; आगे के लिए `agents.defaults` + `agents.list` को प्राथमिकता दें।
</Note>

---

## टूल प्रतिबंध उदाहरण

<Tabs>
  <Tab title="Read-only agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Shell execution with filesystem tools disabled">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    यह नीति OpenClaw फ़ाइल-सिस्टम टूल अक्षम करती है, लेकिन `exec` अब भी एक शेल है और चयनित होस्ट या sandbox फ़ाइल-सिस्टम जहाँ अनुमति देता है, वहाँ फ़ाइलें लिख सकता है। केवल-पढ़ने वाले एजेंट के लिए, `exec` और `process` को अस्वीकार करें, या शेल पहुंच को sandbox फ़ाइल-सिस्टम नियंत्रणों जैसे `agents.defaults.sandbox.workspaceAccess: "ro"` या `"none"` के साथ मिलाएँ।
    </Warning>

  </Tab>
  <Tab title="Communication-only">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    इस प्रोफ़ाइल में `sessions_history` अब भी कच्चे ट्रांसक्रिप्ट डंप के बजाय एक सीमित, सैनिटाइज़ किया हुआ रिकॉल दृश्य लौटाता है। Assistant रिकॉल सोच टैग, `<relevant-memories>` स्कैफ़ोल्डिंग, सादे-पाठ टूल-कॉल XML पेलोड (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और काटे गए टूल-कॉल ब्लॉक सहित), डाउनग्रेड की गई टूल-कॉल स्कैफ़ोल्डिंग, लीक हुए ASCII/पूर्ण-चौड़ाई मॉडल नियंत्रण टोकन, और विकृत MiniMax टूल-कॉल XML को रिडैक्शन/ट्रंकेशन से पहले हटा देता है।

  </Tab>
</Tabs>

---

## सामान्य गलती: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` `session.mainKey` (डिफ़ॉल्ट `"main"`) पर आधारित है, एजेंट id पर नहीं। समूह/चैनल सत्रों को हमेशा अपनी कुंजियाँ मिलती हैं, इसलिए उन्हें non-main माना जाता है और उन्हें sandbox किया जाएगा। यदि आप चाहते हैं कि कोई एजेंट कभी sandbox न हो, तो `agents.list[].sandbox.mode: "off"` सेट करें।
</Warning>

---

## परीक्षण

बहु-एजेंट sandbox और टूल कॉन्फ़िगर करने के बाद:

<Steps>
  <Step title="Check agent resolution">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verify sandbox containers">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Test tool restrictions">
    - ऐसा संदेश भेजें जिसके लिए प्रतिबंधित टूल चाहिए।
    - सत्यापित करें कि एजेंट अस्वीकृत टूल का उपयोग नहीं कर सकता।

  </Step>
  <Step title="Monitor logs">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Agent not sandboxed despite `mode: 'all'`">
    - जाँचें कि कहीं कोई वैश्विक `agents.defaults.sandbox.mode` तो नहीं है जो इसे ओवरराइड कर रहा है।
    - एजेंट-विशिष्ट कॉन्फ़िगरेशन को प्राथमिकता मिलती है, इसलिए `agents.list[].sandbox.mode: "all"` सेट करें।

  </Accordion>
  <Accordion title="Tools still available despite deny list">
    - टूल फ़िल्टरिंग क्रम जाँचें: वैश्विक → एजेंट → sandbox → उप-एजेंट।
    - प्रत्येक स्तर केवल और प्रतिबंधित कर सकता है, अनुमति वापस नहीं दे सकता।
    - लॉग से सत्यापित करें: `[tools] filtering tools for agent:${agentId}`।

  </Accordion>
  <Accordion title="Container not isolated per agent">
    - एजेंट-विशिष्ट sandbox कॉन्फ़िगरेशन में `scope: "agent"` सेट करें।
    - डिफ़ॉल्ट `"session"` है, जो प्रति सत्र एक कंटेनर बनाता है।

  </Accordion>
</AccordionGroup>

---

## संबंधित

- [Elevated मोड](/hi/tools/elevated)
- [Multi-agent रूटिंग](/hi/concepts/multi-agent)
- [Sandbox कॉन्फ़िगरेशन](/hi/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox बनाम टूल नीति बनाम elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) — डिबगिंग: "यह अवरुद्ध क्यों है?"
- [Sandboxing](/hi/gateway/sandboxing) — पूरा sandbox संदर्भ (मोड, स्कोप, बैकएंड, इमेज)
- [सेशन प्रबंधन](/hi/concepts/session)
