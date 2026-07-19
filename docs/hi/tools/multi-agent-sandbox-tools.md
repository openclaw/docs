---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: प्रति-एजेंट सैंडबॉक्स + टूल प्रतिबंध, प्राथमिकता और उदाहरण
title: मल्टी-एजेंट सैंडबॉक्स और टूल्स
x-i18n:
    generated_at: "2026-07-19T10:18:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

बहु-एजेंट सेटअप में प्रत्येक एजेंट वैश्विक sandbox और टूल नीति को ओवरराइड कर सकता है। यह पृष्ठ प्रति-एजेंट कॉन्फ़िगरेशन, प्राथमिकता नियमों और उदाहरणों को शामिल करता है।

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/hi/gateway/sandboxing">
    बैकएंड और मोड — संपूर्ण sandbox संदर्भ।
  </Card>
  <Card title="Sandbox बनाम टूल नीति बनाम elevated" href="/hi/gateway/sandbox-vs-tool-policy-vs-elevated">
    "यह अवरुद्ध क्यों है?" को डीबग करें
  </Card>
  <Card title="Elevated मोड" href="/hi/tools/elevated">
    विश्वसनीय प्रेषकों के लिए elevated exec।
  </Card>
</CardGroup>

<Warning>
प्रमाणीकरण एजेंट के अनुसार सीमित होता है: प्रत्येक एजेंट का `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` में अपना `agentDir` प्रमाणीकरण स्टोर होता है। एजेंटों के बीच कभी भी `agentDir` का पुनः उपयोग न करें। स्थानीय प्रोफ़ाइल न होने पर एजेंट डिफ़ॉल्ट/मुख्य एजेंट की प्रमाणीकरण प्रोफ़ाइल पढ़ सकते हैं, लेकिन OAuth रीफ़्रेश टोकन द्वितीयक एजेंट स्टोर में क्लोन नहीं किए जाते। यदि आप क्रेडेंशियल मैन्युअल रूप से कॉपी करते हैं, तो केवल पोर्टेबल स्थिर `api_key` या `token` प्रोफ़ाइल कॉपी करें।
</Warning>

---

## कॉन्फ़िगरेशन के उदाहरण

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

    - `main` एजेंट: होस्ट पर चलता है, सभी टूल की पहुँच।
    - `family` एजेंट: Docker में चलता है (प्रति एजेंट एक कंटेनर), केवल `read` और वर्तमान वार्तालाप में संदेश भेजने की अनुमति।

  </Accordion>
  <Accordion title="उदाहरण 2: साझा sandbox वाला कार्य एजेंट">
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
  <Accordion title="उदाहरण 2b: वैश्विक कोडिंग प्रोफ़ाइल + केवल संदेश सेवा वाला एजेंट">
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

    - डिफ़ॉल्ट एजेंटों को कोडिंग टूल मिलते हैं।
    - `support` एजेंट केवल संदेश सेवा के लिए है (+ Slack टूल)।

  </Accordion>
  <Accordion title="उदाहरण 3: प्रत्येक एजेंट के लिए अलग-अलग sandbox मोड">
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

जब वैश्विक (`agents.defaults.*`) और एजेंट-विशिष्ट (`agents.list[].*`) दोनों कॉन्फ़िगरेशन मौजूद हों:

### Sandbox कॉन्फ़िगरेशन

एजेंट-विशिष्ट सेटिंग्स वैश्विक सेटिंग्स को ओवरराइड करती हैं:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
उस एजेंट के लिए `agents.list[].sandbox.{docker,browser,prune}.*`, `agents.defaults.sandbox.{docker,browser,prune}.*` को ओवरराइड करता है (जब sandbox का दायरा `"shared"` में हल होता है, तब इसे अनदेखा किया जाता है)।
</Note>

### टूल प्रतिबंध

फ़िल्टरिंग का क्रम यह है:

<Steps>
  <Step title="टूल प्रोफ़ाइल">
    `tools.profile` या `agents.list[].tools.profile`।
  </Step>
  <Step title="प्रदाता टूल प्रोफ़ाइल">
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
  <Step title="Sandbox टूल नीति">
    `tools.sandbox.tools` या `agents.list[].tools.sandbox.tools`।
  </Step>
  <Step title="उप-एजेंट टूल नीति">
    `tools.subagents.tools`, यदि लागू हो।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="प्राथमिकता नियम">
    - प्रत्येक स्तर टूल को और प्रतिबंधित कर सकता है, लेकिन पिछले स्तरों पर अस्वीकृत टूल को दोबारा अनुमति नहीं दे सकता।
    - यदि `agents.list[].tools.sandbox.tools` सेट है, तो यह उस एजेंट के लिए `tools.sandbox.tools` को प्रतिस्थापित करता है।
    - यदि `agents.list[].tools.profile` सेट है, तो यह उस एजेंट के लिए `tools.profile` को ओवरराइड करता है।
    - प्रदाता टूल कुंजियाँ या तो `provider` (जैसे `google-antigravity`) या `provider/model` (जैसे `openai/gpt-5.4`) स्वीकार करती हैं।

  </Accordion>
  <Accordion title="रिक्त अनुमति-सूची का व्यवहार">
    यदि उस शृंखला में कोई स्पष्ट अनुमति-सूची रन को बिना किसी कॉल किए जा सकने वाले टूल के छोड़ देती है, तो OpenClaw मॉडल को प्रॉम्प्ट भेजने से पहले रुक जाता है। यह जानबूझकर किया गया है: `agents.list[].tools.allow: ["query_db"]` जैसे अनुपलब्ध टूल के साथ कॉन्फ़िगर किए गए एजेंट को तब तक स्पष्ट रूप से विफल होना चाहिए, जब तक `query_db` पंजीकृत करने वाला Plugin सक्षम न हो जाए; उसे केवल-पाठ एजेंट के रूप में जारी नहीं रहना चाहिए।
  </Accordion>
</AccordionGroup>

टूल नीतियाँ `group:*` शॉर्टहैंड का समर्थन करती हैं, जो कई टूल में विस्तृत होते हैं। पूरी सूची के लिए [टूल समूह](/hi/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) देखें।

प्रति-एजेंट elevated ओवरराइड (`agents.list[].tools.elevated`) विशिष्ट एजेंटों के लिए elevated exec को और प्रतिबंधित कर सकते हैं। विवरण के लिए [Elevated मोड](/hi/tools/elevated) देखें।

---

## एकल एजेंट से माइग्रेशन

<Tabs>
  <Tab title="पहले (एकल एजेंट)">
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
  <Tab title="बाद में (बहु-एजेंट)">
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
पुरानी `agents.defaults.*`/`agents.list[].*` कॉन्फ़िगरेशन कुंजियाँ (जैसे `sandbox.perSession`, `agentRuntime`, `embeddedPi`) `openclaw doctor` द्वारा माइग्रेट की जाती हैं; आगे से `agents.defaults` + `agents.list` को प्राथमिकता दें।
</Note>

---

## टूल प्रतिबंध के उदाहरण

<Tabs>
  <Tab title="केवल-पठन एजेंट">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="फ़ाइल सिस्टम टूल अक्षम रखते हुए शेल निष्पादन">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    यह नीति OpenClaw फ़ाइल सिस्टम टूल को अक्षम करती है, लेकिन `exec` फिर भी एक शेल है और चयनित होस्ट या sandbox फ़ाइल सिस्टम द्वारा अनुमत किसी भी स्थान पर फ़ाइलें लिख सकता है। केवल-पठन एजेंट के लिए `exec` और `process` को अस्वीकार करें, या शेल पहुँच को `agents.defaults.sandbox.workspaceAccess: "ro"` या `"none"` जैसे sandbox फ़ाइल सिस्टम नियंत्रणों के साथ संयोजित करें।
    </Warning>

  </Tab>
  <Tab title="केवल संचार">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    इस प्रोफ़ाइल में `sessions_history` अब भी अपरिष्कृत ट्रांसक्रिप्ट डंप के बजाय सीमित और स्वच्छ किया गया स्मरण दृश्य लौटाता है। सहायक स्मरण, संपादन/काट-छाँट से पहले विचार टैग, `<relevant-memories>` स्कैफ़ोल्डिंग, सादा-पाठ टूल-कॉल XML पेलोड (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` और काटे गए टूल-कॉल ब्लॉक शामिल हैं), डाउनग्रेड की गई टूल-कॉल स्कैफ़ोल्डिंग, लीक हुए ASCII/पूर्ण-चौड़ाई मॉडल नियंत्रण टोकन और विकृत MiniMax टूल-कॉल XML को हटा देता है।

  </Tab>
</Tabs>

---

## सामान्य समस्या: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` सत्र कुंजी की जाँच मुख्य सत्र कुंजी से करता है (हमेशा `"main"`; `session.mainKey` उपयोगकर्ता द्वारा कॉन्फ़िगर नहीं किया जा सकता, और OpenClaw किसी अन्य मान पर चेतावनी देकर उसे अनदेखा करता है), एजेंट आईडी से नहीं। समूह/चैनल सत्रों को हमेशा अपनी अलग कुंजियाँ मिलती हैं, इसलिए उन्हें गैर-मुख्य माना जाता है और वे sandbox में चलेंगे। यदि आप चाहते हैं कि कोई एजेंट कभी sandbox में न चले, तो `agents.list[].sandbox.mode: "off"` सेट करें।
</Warning>

---

## परीक्षण

बहु-एजेंट sandbox और टूल कॉन्फ़िगर करने के बाद:

<Steps>
  <Step title="एजेंट समाधान जाँचें">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandbox कंटेनर सत्यापित करें">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="टूल प्रतिबंधों का परीक्षण करें">
    - प्रतिबंधित टूल की आवश्यकता वाला संदेश भेजें।
    - सत्यापित करें कि एजेंट अस्वीकृत टूल का उपयोग नहीं कर सकता।

  </Step>
  <Step title="लॉग की निगरानी करें">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## समस्या निवारण

<AccordionGroup>
  <Accordion title="`mode: 'all'` के बावजूद एजेंट sandbox में नहीं है">
    - जाँचें कि क्या कोई वैश्विक `agents.defaults.sandbox.mode` इसे ओवरराइड कर रहा है।
    - एजेंट-विशिष्ट कॉन्फ़िगरेशन को प्राथमिकता मिलती है, इसलिए `agents.list[].sandbox.mode: "all"` सेट करें।

  </Accordion>
  <Accordion title="अस्वीकृति सूची के बावजूद टूल अब भी उपलब्ध हैं">
    - [संपूर्ण फ़िल्टरिंग क्रम](#tool-restrictions) जाँचें: प्रोफ़ाइल → प्रदाता प्रोफ़ाइल → वैश्विक नीति → प्रदाता नीति → एजेंट नीति → एजेंट प्रदाता नीति → sandbox → उप-एजेंट।
    - प्रत्येक स्तर केवल और प्रतिबंध लगा सकता है, दोबारा अनुमति नहीं दे सकता।
    - चरण-दर-चरण डीबगिंग के लिए [Sandbox बनाम टूल नीति बनाम elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) देखें।

  </Accordion>
  <Accordion title="कंटेनर प्रति एजेंट पृथक नहीं है">
    - डिफ़ॉल्ट `scope` `"agent"` है (प्रति एजेंट आईडी एक कंटेनर)।
    - प्रति सत्र एक कंटेनर के लिए `scope: "session"` सेट करें, या सभी एजेंट में एक कंटेनर का पुनः उपयोग करने के लिए `scope: "shared"` सेट करें।

  </Accordion>
</AccordionGroup>

---

## संबंधित

- [उन्नत मोड](/hi/tools/elevated)
- [मल्टी-एजेंट रूटिंग](/hi/concepts/multi-agent)
- [सैंडबॉक्स कॉन्फ़िगरेशन](/hi/gateway/config-agents#agentsdefaultssandbox)
- [सैंडबॉक्स बनाम टूल नीति बनाम उन्नत](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) — डीबग करना: "यह अवरुद्ध क्यों है?"
- [सैंडबॉक्सिंग](/hi/gateway/sandboxing) — सैंडबॉक्स का पूर्ण संदर्भ (मोड, दायरे, बैकएंड, इमेज)
- [सत्र प्रबंधन](/hi/concepts/session)
