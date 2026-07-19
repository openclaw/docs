---
read_when:
    - आप OpenClaw के साथ स्थानीय ComfyUI वर्कफ़्लो का उपयोग करना चाहते हैं
    - आप इमेज, वीडियो या संगीत वर्कफ़्लो के साथ Comfy Cloud का उपयोग करना चाहते हैं
    - आपको बंडल किए गए comfy Plugin की कॉन्फ़िगरेशन कुंजियाँ चाहिए
summary: OpenClaw में ComfyUI वर्कफ़्लो द्वारा इमेज, वीडियो और संगीत जनरेशन का सेटअप
title: ComfyUI
x-i18n:
    generated_at: "2026-07-19T09:30:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw वर्कफ़्लो-संचालित ComfyUI रन के लिए एक बंडल किया गया `comfy` plugin प्रदान करता है। यह
plugin पूरी तरह वर्कफ़्लो-संचालित है: OpenClaw सामान्य `size`,
`aspectRatio`, `resolution`, `durationSeconds`, या TTS-जैसे नियंत्रणों को
आपके ग्राफ़ पर मैप नहीं करता।

| गुण          | विवरण                                                                            |
| ------------ | -------------------------------------------------------------------------------- |
| प्रदाता      | `comfy`                                                               |
| मॉडल         | `comfy/workflow`                                                               |
| साझा टूल     | `image_generate`, `video_generate`, `music_generate`                      |
| प्रमाणीकरण   | स्थानीय ComfyUI के लिए कोई नहीं; Comfy Cloud के लिए `COMFY_API_KEY` या `COMFY_CLOUD_API_KEY` |
| API          | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*` |

## यह किन चीज़ों का समर्थन करता है

- वर्कफ़्लो JSON से इमेज जनरेशन और संपादन (संपादन के लिए 1 अपलोड की गई संदर्भ इमेज आवश्यक है)
- वर्कफ़्लो JSON से वीडियो जनरेशन, टेक्स्ट-से-वीडियो या इमेज-से-वीडियो (1 संदर्भ इमेज)
- साझा `music_generate` टूल के माध्यम से संगीत/ऑडियो जनरेशन, वैकल्पिक 1 संदर्भ इमेज के साथ
- कॉन्फ़िगर किए गए Node से आउटपुट डाउनलोड, या कोई Node कॉन्फ़िगर न होने पर सभी मेल खाने वाले आउटपुट Node से

## आरंभ करना

अपनी मशीन पर ComfyUI चलाने या Comfy Cloud का उपयोग करने में से चुनें।

<Tabs>
  <Tab title="स्थानीय">
    **इसके लिए सर्वोत्तम:** अपनी मशीन या LAN पर अपना ComfyUI इंस्टेंस चलाना।

    <Steps>
      <Step title="ComfyUI को स्थानीय रूप से शुरू करें">
        सुनिश्चित करें कि आपका स्थानीय ComfyUI इंस्टेंस चल रहा है (डिफ़ॉल्ट `http://127.0.0.1:8188` है)।
      </Step>
      <Step title="अपना वर्कफ़्लो JSON तैयार करें">
        ComfyUI वर्कफ़्लो JSON फ़ाइल एक्सपोर्ट करें या बनाएँ। प्रॉम्प्ट इनपुट Node और उस आउटपुट Node की Node ID नोट करें जिससे आप OpenClaw को पढ़वाना चाहते हैं।
      </Step>
      <Step title="प्रदाता कॉन्फ़िगर करें">
        `mode: "local"` सेट करें और अपनी वर्कफ़्लो फ़ाइल की ओर इंगित करें। न्यूनतम इमेज उदाहरण:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        OpenClaw को आपके द्वारा कॉन्फ़िगर की गई क्षमता के `comfy/workflow` मॉडल की ओर इंगित करें:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **इसके लिए सर्वोत्तम:** स्थानीय GPU संसाधनों का प्रबंधन किए बिना Comfy Cloud पर वर्कफ़्लो चलाना।

    <Steps>
      <Step title="API कुंजी प्राप्त करें">
        [comfy.org](https://comfy.org) पर साइन अप करें और अपने अकाउंट डैशबोर्ड से API कुंजी जनरेट करें।
      </Step>
      <Step title="API कुंजी सेट करें">
        इनमें से किसी भी विधि से अपनी कुंजी दें:

        ```bash
        # ऑनबोर्डिंग फ़्लैग
        openclaw onboard --comfy-api-key "your-key"

        # पर्यावरण चर (डेमन के लिए वरीय)
        export COMFY_API_KEY="your-key"

        # वैकल्पिक पर्यावरण चर
        export COMFY_CLOUD_API_KEY="your-key"

        # या कॉन्फ़िगरेशन में इनलाइन
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="अपना वर्कफ़्लो JSON तैयार करें">
        ComfyUI वर्कफ़्लो JSON फ़ाइल एक्सपोर्ट करें या बनाएँ। प्रॉम्प्ट इनपुट Node और आउटपुट Node की Node ID नोट करें।
      </Step>
      <Step title="प्रदाता कॉन्फ़िगर करें">
        `mode: "cloud"` सेट करें और अपनी वर्कफ़्लो फ़ाइल की ओर इंगित करें:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        क्लाउड मोड में `baseUrl` का डिफ़ॉल्ट `https://cloud.comfy.org` होता है। केवल कस्टम क्लाउड एंडपॉइंट के लिए `baseUrl` सेट करें।
        </Tip>
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## कॉन्फ़िगरेशन

Comfy साझा शीर्ष-स्तरीय कनेक्शन सेटिंग्स के साथ-साथ प्रति-क्षमता वर्कफ़्लो अनुभागों (`image`, `video`, `music`) का समर्थन करता है:

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### साझा कुंजियाँ

| कुंजी                  | प्रकार                 | विवरण                                                                                 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` या `"cloud"` | कनेक्शन मोड। डिफ़ॉल्ट `"local"` है।                              |
| `baseUrl`             | स्ट्रिंग                | स्थानीय के लिए डिफ़ॉल्ट `http://127.0.0.1:8188` या क्लाउड के लिए `https://cloud.comfy.org` है। |
| `apiKey`              | स्ट्रिंग                | वैकल्पिक इनलाइन कुंजी, `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` पर्यावरण चरों का विकल्प। |
| `allowPrivateNetwork` | बूलियन                | क्लाउड मोड में निजी/LAN `baseUrl` या स्थानीय निजी-DNS FQDN की अनुमति दें। |

<Note>
`local` मोड में, लूपबैक/निजी IP लिटरल और `http://comfyui:8188` जैसे एकल-लेबल सेवा नाम `allowPrivateNetwork` के बिना काम करते हैं। `https://comfy.local.example.com` जैसे सार्वजनिक दिखने वाले निजी-DNS FQDN के लिए `allowPrivateNetwork: true` आवश्यक है। निजी-ओरिजिन विश्वास कॉन्फ़िगर की गई स्कीम, होस्टनाम और पोर्ट तक सीमित रहता है; स्थानीय रीडायरेक्ट कॉन्फ़िगर किए गए होस्टनाम से बाहर नहीं जा सकते, जबकि सार्वजनिक CDN के लिए क्लाउड रीडायरेक्ट डिफ़ॉल्ट SSRF नीति से जाँचे जाते हैं।
</Note>

### प्रति-क्षमता कुंजियाँ

ये कुंजियाँ `image`, `video`, या `music` अनुभागों के भीतर लागू होती हैं:

| कुंजी                        | आवश्यक | डिफ़ॉल्ट | विवरण                                                                        |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` या `workflowPath` | हाँ      | --       | इनलाइन वर्कफ़्लो JSON, या ComfyUI वर्कफ़्लो JSON फ़ाइल का पथ।               |
| `promptNodeId`               | हाँ      | --       | वह Node ID जो टेक्स्ट प्रॉम्प्ट प्राप्त करती है।                             |
| `promptInputName`            | नहीं     | `"text"` | प्रॉम्प्ट Node पर इनपुट का नाम।                                              |
| `outputNodeId`               | नहीं     | --       | आउटपुट पढ़ने की Node ID। छोड़े जाने पर सभी मेल खाने वाले आउटपुट Node उपयोग किए जाते हैं। |
| `pollIntervalMs`             | नहीं     | `1500`   | कार्य पूरा होने के लिए मिलीसेकंड में पोलिंग अंतराल।                         |
| `timeoutMs`                  | नहीं     | `300000` | वर्कफ़्लो रन के लिए मिलीसेकंड में टाइमआउट।                                  |

`image` और `video` अनुभाग संदर्भ-इमेज इनपुट Node का भी समर्थन करते हैं:

| कुंजी                  | आवश्यक                                  | डिफ़ॉल्ट | विवरण                                               |
| --------------------- | --------------------------------------- | -------- | --------------------------------------------------- |
| `inputImageNodeId`    | हाँ (संदर्भ इमेज पास करते समय)          | --       | वह Node ID जो अपलोड की गई संदर्भ इमेज प्राप्त करती है। |
| `inputImageInputName` | नहीं                                    | `"image"` | इमेज Node पर इनपुट का नाम।                          |

`apiKey` या तो लिटरल स्ट्रिंग या [सीक्रेट संदर्भ](/hi/gateway/configuration-reference#secrets) ऑब्जेक्ट स्वीकार करता है।

## वर्कफ़्लो विवरण

<AccordionGroup>
  <Accordion title="इमेज वर्कफ़्लो">
    डिफ़ॉल्ट इमेज मॉडल को `comfy/workflow` पर सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **संदर्भ-इमेज संपादन उदाहरण:**

    अपलोड की गई संदर्भ इमेज के साथ इमेज संपादन सक्षम करने के लिए, अपने इमेज कॉन्फ़िगरेशन में `inputImageNodeId` जोड़ें:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="वीडियो वर्कफ़्लो">
    डिफ़ॉल्ट वीडियो मॉडल को `comfy/workflow` पर सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy वीडियो वर्कफ़्लो कॉन्फ़िगर किए गए ग्राफ़ के माध्यम से टेक्स्ट-से-वीडियो और इमेज-से-वीडियो का समर्थन करते हैं।

    <Note>
    OpenClaw इनपुट वीडियो को Comfy वर्कफ़्लो में पास नहीं करता। इनपुट के रूप में केवल टेक्स्ट प्रॉम्प्ट और एकल संदर्भ इमेज समर्थित हैं।
    </Note>

  </Accordion>

  <Accordion title="संगीत वर्कफ़्लो">
    बंडल किया गया plugin वर्कफ़्लो-परिभाषित ऑडियो या संगीत आउटपुट के लिए संगीत-जनरेशन प्रदाता पंजीकृत करता है, जिसे साझा `music_generate` टूल के माध्यम से उपलब्ध कराया जाता है। यह वैकल्पिक संदर्भ इमेज (अधिकतम 1) स्वीकार करता है:

    ```text
    /tool music_generate prompt="मुलायम टेप टेक्सचर वाला गर्म परिवेशी सिंथ लूप"
    ```

    अपने ऑडियो वर्कफ़्लो JSON और आउटपुट Node की ओर इंगित करने के लिए `music` कॉन्फ़िगरेशन अनुभाग का उपयोग करें।

  </Accordion>

  <Accordion title="पश्चगामी संगतता">
    मौजूदा शीर्ष-स्तरीय इमेज कॉन्फ़िगरेशन (नेस्टेड `image` अनुभाग के बिना) अब भी काम करता है:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw उस पुराने स्वरूप को इमेज वर्कफ़्लो कॉन्फ़िगरेशन मानता है। आपको तुरंत माइग्रेट करने की आवश्यकता नहीं है, लेकिन नए सेटअप के लिए नेस्टेड `image` / `video` / `music` अनुभाग अनुशंसित हैं। यदि आप केवल इमेज जनरेशन का उपयोग करते हैं, तो पुराना फ़्लैट कॉन्फ़िगरेशन और नया नेस्टेड `image` अनुभाग कार्यात्मक रूप से समान हैं।

  </Accordion>

  <Accordion title="लाइव परीक्षण">
    बंडल किए गए Plugin के लिए ऑप्ट-इन लाइव कवरेज उपलब्ध है:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    यदि संबंधित Comfy वर्कफ़्लो अनुभाग कॉन्फ़िगर नहीं है, तो लाइव परीक्षण अलग-अलग इमेज, वीडियो या संगीत मामलों को छोड़ देता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="इमेज जनरेशन" href="/hi/tools/image-generation" icon="image">
    इमेज जनरेशन टूल का कॉन्फ़िगरेशन और उपयोग।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    वीडियो जनरेशन टूल का कॉन्फ़िगरेशन और उपयोग।
  </Card>
  <Card title="संगीत जनरेशन" href="/hi/tools/music-generation" icon="music">
    संगीत और ऑडियो जनरेशन टूल का सेटअप।
  </Card>
  <Card title="प्रदाता डायरेक्टरी" href="/hi/providers/index" icon="layers">
    सभी प्रदाताओं और मॉडल रेफ़रेंस का अवलोकन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    एजेंट डिफ़ॉल्ट सहित पूरा कॉन्फ़िगरेशन संदर्भ।
  </Card>
</CardGroup>
