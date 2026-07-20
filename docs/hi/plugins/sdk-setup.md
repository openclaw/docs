---
read_when:
    - आप किसी Plugin में सेटअप विज़ार्ड जोड़ रहे हैं
    - आपको setup-entry.ts और index.ts के बीच का अंतर समझना होगा
    - आप Plugin कॉन्फ़िगरेशन स्कीमा या package.json में OpenClaw मेटाडेटा परिभाषित कर रहे हैं
sidebarTitle: Setup and config
summary: सेटअप विज़ार्ड, setup-entry.ts, कॉन्फ़िग स्कीमा और package.json मेटाडेटा
title: Plugin सेटअप और कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-07-20T07:13:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4438acb2de929c4eca7332245737e614ad00d8a6712191d9d9bd004da84c3b6
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin पैकेजिंग (`package.json` मेटाडेटा), मैनिफ़ेस्ट (`openclaw.plugin.json`), सेटअप एंट्री और कॉन्फ़िग स्कीमा के लिए संदर्भ।

<Tip>
**चरण-दर-चरण मार्गदर्शिका खोज रहे हैं?** कैसे-करें मार्गदर्शिकाएँ संदर्भ सहित पैकेजिंग समझाती हैं: [चैनल plugins](/hi/plugins/sdk-channel-plugins#step-1-package-and-manifest) और [प्रोवाइडर plugins](/hi/plugins/sdk-provider-plugins#step-1-package-and-manifest)।
</Tip>

## पैकेज मेटाडेटा

आपके `package.json` में एक `openclaw` फ़ील्ड होना आवश्यक है, जो plugin सिस्टम को बताता है कि आपका plugin क्या प्रदान करता है:

<Tabs>
  <Tab title="चैनल plugin">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="प्रोवाइडर plugin / ClawHub आधाररेखा">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
ClawHub पर बाहरी रूप से प्रकाशित करने के लिए `compat` और `build` आवश्यक हैं। प्रामाणिक प्रकाशन स्निपेट `docs/snippets/plugin-publish/` में उपलब्ध हैं।
</Note>

### `openclaw` फ़ील्ड

<ParamField path="extensions" type="string[]">
  एंट्री पॉइंट फ़ाइलें (पैकेज रूट के सापेक्ष)। वर्कस्पेस और git चेकआउट डेवलपमेंट के लिए मान्य स्रोत एंट्री।
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions` के लिए निर्मित JavaScript समकक्ष, जिन्हें OpenClaw द्वारा इंस्टॉल किया गया npm पैकेज लोड करते समय प्राथमिकता दी जाती है। स्रोत/निर्मित रिज़ॉल्यूशन क्रम के लिए [SDK एंट्री पॉइंट](/hi/plugins/sdk-entrypoints) देखें।
</ParamField>
<ParamField path="setupEntry" type="string">
  हल्की, केवल-सेटअप एंट्री (वैकल्पिक)।
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` के लिए निर्मित JavaScript समकक्ष। `setupEntry` को भी सेट करना आवश्यक है।
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` फ़ॉलबैक plugin पहचान, जिसका उपयोग तब किया जाता है जब किसी plugin में ऐसी चैनल/प्रोवाइडर मेटाडेटा न हो जिससे id या लेबल प्राप्त किया जा सके।
</ParamField>
<ParamField path="channel" type="object">
  सेटअप, चयनकर्ता, क्विकस्टार्ट और स्थिति सतहों के लिए चैनल कैटलॉग मेटाडेटा।
</ParamField>
<ParamField path="install" type="object">
  इंस्टॉल संकेत: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`।
</ParamField>
<ParamField path="startup" type="object">
  स्टार्टअप व्यवहार फ़्लैग।
</ParamField>
<ParamField path="compat" type="object">
  इस plugin द्वारा समर्थित `pluginApi` संस्करण सीमा। बाहरी ClawHub प्रकाशनों के लिए आवश्यक।
</ParamField>

<Note>
प्रोवाइडर id (`providers: string[]`) मैनिफ़ेस्ट मेटाडेटा हैं, पैकेज मेटाडेटा नहीं। इन्हें यहाँ नहीं, बल्कि `openclaw.plugin.json` में घोषित करें — [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) देखें।
</Note>

### `openclaw.channel`

`openclaw.channel` रनटाइम लोड होने से पहले चैनल खोज और सेटअप सतहों के लिए हल्का पैकेज मेटाडेटा है।

| फ़ील्ड                                  | प्रकार       | इसका अर्थ                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | प्रामाणिक चैनल id।                                                         |
| `label`                                | `string`   | प्राथमिक चैनल लेबल।                                                        |
| `selectionLabel`                       | `string`   | चयनकर्ता/सेटअप लेबल, जब यह `label` से अलग होना चाहिए।                        |
| `detailLabel`                          | `string`   | अधिक समृद्ध चैनल कैटलॉग और स्थिति सतहों के लिए द्वितीयक विवरण लेबल।       |
| `docsPath`                             | `string`   | सेटअप और चयन लिंक के लिए दस्तावेज़ पथ।                                      |
| `docsLabel`                            | `string`   | दस्तावेज़ लिंक के लिए प्रयुक्त ओवरराइड लेबल, जब यह चैनल id से अलग होना चाहिए। |
| `blurb`                                | `string`   | संक्षिप्त ऑनबोर्डिंग/कैटलॉग विवरण।                                         |
| `order`                                | `number`   | चैनल कैटलॉग में क्रमबद्धता क्रम।                                               |
| `aliases`                              | `string[]` | चैनल चयन के लिए अतिरिक्त लुकअप उपनाम।                                   |
| `preferOver`                           | `string[]` | निम्न-प्राथमिकता वाले plugin/चैनल id जिन्हें इस चैनल से कम वरीयता मिलनी चाहिए।                |
| `systemImage`                          | `string`   | चैनल UI कैटलॉग के लिए वैकल्पिक आइकन/सिस्टम-इमेज नाम।                      |
| `selectionDocsPrefix`                  | `string`   | चयन सतहों में दस्तावेज़ लिंक से पहले का उपसर्ग पाठ।                          |
| `selectionDocsOmitLabel`               | `boolean`  | चयन प्रतिलिपि में लेबल वाले दस्तावेज़ लिंक के बजाय दस्तावेज़ पथ सीधे दिखाएँ। |
| `selectionExtras`                      | `string[]` | चयन प्रतिलिपि में जोड़ी जाने वाली अतिरिक्त छोटी स्ट्रिंग।                               |
| `markdownCapable`                      | `boolean`  | आउटबाउंड फ़ॉर्मेटिंग निर्णयों के लिए चैनल को markdown-सक्षम चिह्नित करता है।      |
| `exposure`                             | `object`   | सेटअप, कॉन्फ़िगर की गई सूचियों और दस्तावेज़ सतहों के लिए चैनल दृश्यता नियंत्रण।   |
| `quickstartAllowFrom`                  | `boolean`  | इस चैनल को मानक क्विकस्टार्ट `allowFrom` सेटअप प्रवाह में शामिल करें।         |
| `forceAccountBinding`                  | `boolean`  | केवल एक खाता मौजूद होने पर भी स्पष्ट खाता बाइंडिंग आवश्यक बनाएँ।           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | इस चैनल के लिए घोषणा लक्ष्य रिज़ॉल्व करते समय सेशन लुकअप को प्राथमिकता दें।       |

उदाहरण:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` निम्न का समर्थन करता है:

- `configured`: कॉन्फ़िगर की गई/स्थिति-शैली सूची सतहों में चैनल शामिल करें
- `setup`: इंटरैक्टिव सेटअप/कॉन्फ़िगर चयनकर्ताओं में चैनल शामिल करें
- `docs`: दस्तावेज़/नेविगेशन सतहों में चैनल को सार्वजनिक रूप से दृश्यमान चिह्नित करें

### `openclaw.install`

`openclaw.install` पैकेज मेटाडेटा है, मैनिफ़ेस्ट मेटाडेटा नहीं।

| फ़ील्ड                        | प्रकार                                | इसका अर्थ                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | इंस्टॉल/अपडेट और ऑनबोर्डिंग के माँग-पर-इंस्टॉल प्रवाहों के लिए प्रामाणिक ClawHub स्पेक। |
| `npmSpec`                    | `string`                            | इंस्टॉल/अपडेट फ़ॉलबैक प्रवाहों के लिए प्रामाणिक npm स्पेक।                             |
| `localPath`                  | `string`                            | स्थानीय डेवलपमेंट या बंडल किया गया इंस्टॉल पथ।                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | एकाधिक स्रोत उपलब्ध होने पर पसंदीदा इंस्टॉल स्रोत।                     |
| `minHostVersion`             | `string`                            | न्यूनतम समर्थित OpenClaw संस्करण, `>=x.y.z` या `>=x.y.z-prerelease`।            |
| `expectedIntegrity`          | `string`                            | पिन किए गए इंस्टॉल के लिए अपेक्षित npm dist इंटेग्रिटी स्ट्रिंग, सामान्यतः `sha512-...`।    |
| `allowInvalidConfigRecovery` | `boolean`                           | बंडल किए गए plugin के पुनः इंस्टॉल प्रवाहों को विशिष्ट पुराने-कॉन्फ़िग विफलताओं से पुनर्प्राप्त होने देता है।  |
| `requiredPlatformPackages`   | `string[]`                          | npm इंस्टॉल के दौरान सत्यापित आवश्यक प्लेटफ़ॉर्म-विशिष्ट npm उपनाम।               |

<AccordionGroup>
  <Accordion title="ऑनबोर्डिंग व्यवहार">
    इंटरैक्टिव ऑनबोर्डिंग माँग-पर-इंस्टॉल सतहों के लिए `openclaw.install` का उपयोग करती है: यदि आपका plugin रनटाइम लोड होने से पहले प्रोवाइडर प्रमाणीकरण विकल्प या चैनल सेटअप/कैटलॉग मेटाडेटा प्रदर्शित करता है, तो ऑनबोर्डिंग ClawHub, npm या स्थानीय इंस्टॉल के लिए संकेत दे सकती है, plugin को इंस्टॉल या सक्षम कर सकती है और फिर चयनित प्रवाह जारी रख सकती है। ClawHub विकल्प `clawhubSpec` का उपयोग करते हैं और मौजूद होने पर उन्हें प्राथमिकता दी जाती है; npm विकल्पों के लिए रजिस्ट्री `npmSpec` वाला विश्वसनीय कैटलॉग मेटाडेटा आवश्यक है (सटीक संस्करण और `expectedIntegrity` वैकल्पिक पिन हैं, जिन्हें सेट होने पर इंस्टॉल/अपडेट के दौरान लागू किया जाता है)। "क्या दिखाना है" को `openclaw.plugin.json` में और "इसे कैसे इंस्टॉल करना है" को `package.json` में रखें।
  </Accordion>
  <Accordion title="minHostVersion प्रवर्तन">
    यदि `minHostVersion` सेट है, तो इंस्टॉल और गैर-बंडल मैनिफ़ेस्ट-रजिस्ट्री लोडिंग दोनों इसे लागू करते हैं। पुराने होस्ट बाहरी plugins को छोड़ देते हैं; अमान्य संस्करण स्ट्रिंग अस्वीकार कर दी जाती हैं। बंडल किए गए स्रोत plugins को होस्ट चेकआउट के समान संस्करण वाला माना जाता है।
  </Accordion>
  <Accordion title="पिन किए गए npm इंस्टॉल">
    पिन किए गए npm इंस्टॉल के लिए सटीक संस्करण `npmSpec` में रखें और अपेक्षित आर्टिफ़ैक्ट इंटेग्रिटी जोड़ें:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery का दायरा">
    `allowInvalidConfigRecovery` खराब कॉन्फ़िग के लिए सामान्य बायपास नहीं है। यह केवल सीमित बंडल-plugin पुनर्प्राप्ति है, जो पुनः इंस्टॉल/सेटअप को ज्ञात अपग्रेड अवशेषों की मरम्मत करने देती है, जैसे अनुपलब्ध बंडल plugin पथ या उसी plugin के लिए पुरानी `channels.<id>` एंट्री। यदि कॉन्फ़िग असंबंधित कारणों से खराब है, तो इंस्टॉल अब भी बंद अवस्था में विफल होता है और ऑपरेटर को `openclaw doctor --fix` चलाने के लिए कहता है।
  </Accordion>
</AccordionGroup>

### स्थगित पूर्ण लोड

चैनल plugins निम्न के साथ स्थगित लोडिंग चुन सकते हैं:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

सक्षम होने पर, OpenClaw प्री-लिसन स्टार्टअप चरण के दौरान केवल `setupEntry` लोड करता है, यहाँ तक कि पहले से कॉन्फ़िगर किए गए चैनलों के लिए भी। Gateway के सुनना शुरू करने के बाद पूर्ण एंट्री लोड होती है।

<Warning>
स्थगित लोडिंग केवल तभी सक्षम करें, जब आपका `setupEntry` Gateway के सुनना शुरू करने से पहले उसकी आवश्यकता की हर चीज़ पंजीकृत करता हो (चैनल पंजीकरण, HTTP रूट, Gateway विधियाँ)। यदि पूर्ण एंट्री के पास आवश्यक स्टार्टअप क्षमताओं का स्वामित्व है, तो डिफ़ॉल्ट व्यवहार बनाए रखें।
</Warning>

यदि आपकी सेटअप/पूर्ण एंट्री Gateway RPC विधियाँ पंजीकृत करती है, तो उन्हें Plugin-विशिष्ट प्रीफ़िक्स पर रखें। आरक्षित कोर एडमिन नेमस्पेस (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) कोर के स्वामित्व में रहते हैं और हमेशा `operator.admin` में सामान्यीकृत होते हैं।

## Plugin मैनिफ़ेस्ट

हर नेटिव Plugin को पैकेज रूट में एक `openclaw.plugin.json` शामिल करना आवश्यक है। OpenClaw इसका उपयोग Plugin कोड निष्पादित किए बिना कॉन्फ़िगरेशन सत्यापित करने के लिए करता है।

```json
{
  "id": "my-plugin",
  "name": "मेरा Plugin",
  "description": "OpenClaw में मेरे Plugin की क्षमताएँ जोड़ता है",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook सत्यापन सीक्रेट"
      }
    }
  }
}
```

चैनल Plugin के लिए, `channels` जोड़ें (और प्रदाता Plugin में `providers` जोड़ें):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

यहाँ तक कि बिना कॉन्फ़िगरेशन वाले Plugin को भी स्कीमा शामिल करना आवश्यक है। खाली स्कीमा मान्य है:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

स्कीमा के संपूर्ण संदर्भ के लिए [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) देखें।

## ClawHub पर प्रकाशन

Skills और Plugin पैकेज अलग-अलग ClawHub प्रकाशन कमांड का उपयोग करते हैं। Plugin पैकेज के लिए पैकेज-विशिष्ट कमांड का उपयोग करें:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` किसी Skill फ़ोल्डर को प्रकाशित करने का अलग कमांड है, Plugin पैकेज का नहीं। [ClawHub पर प्रकाशन](/hi/clawhub/publishing) देखें।
</Note>

## सेटअप एंट्री

`setup-entry.ts`, `index.ts` का हल्का विकल्प है, जिसे OpenClaw तब लोड करता है जब उसे केवल सेटअप सतहों की आवश्यकता होती है (ऑनबोर्डिंग, कॉन्फ़िगरेशन सुधार, अक्षम चैनल निरीक्षण):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

यह सेटअप प्रवाहों के दौरान भारी रनटाइम कोड (क्रिप्टो लाइब्रेरी, CLI पंजीकरण, बैकग्राउंड सेवाएँ) लोड करने से बचाता है।

साइडकार मॉड्यूल में सेटअप-सुरक्षित एक्सपोर्ट रखने वाले बंडल किए गए वर्कस्पेस चैनल, `defineSetupPluginEntry(...)` के बजाय `openclaw/plugin-sdk/channel-entry-contract` से `defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं। वह बंडल अनुबंध एक वैकल्पिक `runtime` एक्सपोर्ट का भी समर्थन करता है, ताकि सेटअप-समय रनटाइम वायरिंग हल्की और स्पष्ट रह सके।

<AccordionGroup>
  <Accordion title="OpenClaw पूर्ण एंट्री के बजाय setupEntry का उपयोग कब करता है">
    - चैनल अक्षम है, लेकिन उसे सेटअप/ऑनबोर्डिंग सतहों की आवश्यकता है।
    - चैनल सक्षम है, लेकिन कॉन्फ़िगर नहीं किया गया है।
    - स्थगित लोडिंग सक्षम है (`deferConfiguredChannelFullLoadUntilAfterListen`)।

  </Accordion>
  <Accordion title="setupEntry को क्या पंजीकृत करना आवश्यक है">
    - चैनल Plugin ऑब्जेक्ट (`defineSetupPluginEntry` के माध्यम से)।
    - Gateway के सुनने से पहले आवश्यक कोई भी HTTP रूट।
    - स्टार्टअप के दौरान आवश्यक कोई भी Gateway विधि।

    उन स्टार्टअप Gateway विधियों को फिर भी `config.*` या `update.*` जैसे आरक्षित कोर एडमिन नेमस्पेस से बचना चाहिए।

  </Accordion>
  <Accordion title="setupEntry में क्या शामिल नहीं होना चाहिए">
    - CLI पंजीकरण।
    - बैकग्राउंड सेवाएँ।
    - भारी रनटाइम इंपोर्ट (क्रिप्टो, SDK)।
    - केवल स्टार्टअप के बाद आवश्यक Gateway विधियाँ।

  </Accordion>
</AccordionGroup>

### सीमित सेटअप हेल्पर इंपोर्ट

हॉट सेटअप-मात्र पथों के लिए, जब आपको सेटअप सतह के केवल एक भाग की आवश्यकता हो, तो व्यापक `plugin-sdk/setup` अम्ब्रेला के बजाय सीमित सेटअप हेल्पर सीम को प्राथमिकता दें:

| इंपोर्ट पथ                | इसका उपयोग करें                                                                                | मुख्य एक्सपोर्ट                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | सेटअप-समय रनटाइम हेल्पर, जो `setupEntry` / स्थगित चैनल स्टार्टअप में उपलब्ध रहते हैं | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | सेटअप/इंस्टॉल CLI/आर्काइव/दस्तावेज़ हेल्पर                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

जब आपको `moveSingleAccountChannelSectionToDefaultAccount(...)` जैसे कॉन्फ़िगरेशन-पैच हेल्पर सहित पूरा साझा सेटअप टूलबॉक्स चाहिए, तब व्यापक `plugin-sdk/setup` सीम का उपयोग करें।

निश्चित सेटअप विज़ार्ड टेक्स्ट के लिए `createSetupTranslator(...)` का उपयोग करें। यह इसी क्रम में `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, और `LANG` से पहला गैर-रिक्त मान उपयोग करता है, फिर अंग्रेज़ी पर फ़ॉलबैक करता है। स्पष्ट अंग्रेज़ी ओवरराइड के लिए `OPENCLAW_LOCALE=en` सेट करें। Plugin-विशिष्ट सेटअप टेक्स्ट को Plugin-स्वामित्व वाले कोड में रखें और साझा कैटलॉग कुंजियों का उपयोग केवल सामान्य सेटअप लेबल, स्थिति टेक्स्ट और आधिकारिक बंडल किए गए Plugin सेटअप टेक्स्ट के लिए करें।

सेटअप पैच अडैप्टर इंपोर्ट किए जाने पर हॉट-पाथ सुरक्षित रहते हैं। उनके बंडल किए गए एकल-अकाउंट प्रमोशन अनुबंध-सतह का लुकअप लेज़ी है, इसलिए `plugin-sdk/setup-runtime` को इंपोर्ट करने पर अडैप्टर के वास्तव में उपयोग होने से पहले बंडल अनुबंध-सतह खोज उत्सुकता से लोड नहीं होती।

### चैनल-स्वामित्व वाला एकल-अकाउंट प्रमोशन

जब कोई चैनल एकल-अकाउंट शीर्ष-स्तरीय कॉन्फ़िगरेशन से `channels.<id>.accounts.*` में अपग्रेड होता है, तो डिफ़ॉल्ट साझा व्यवहार प्रमोट किए गए अकाउंट-स्कोप वाले मानों को `accounts.default` में ले जाता है।

बंडल किए गए चैनल अपनी सेटअप अनुबंध सतह के माध्यम से उस प्रमोशन को सीमित या ओवरराइड कर सकते हैं:

- `singleAccountKeysToMove`: अतिरिक्त शीर्ष-स्तरीय कुंजियाँ, जिन्हें प्रमोट किए गए अकाउंट में ले जाना चाहिए
- `namedAccountPromotionKeys`: जब नामित अकाउंट पहले से मौजूद हों, तो केवल ये कुंजियाँ प्रमोट किए गए अकाउंट में जाती हैं; साझा नीति/डिलीवरी कुंजियाँ चैनल रूट पर रहती हैं
- `resolveSingleAccountPromotionTarget(...)`: चुनें कि कौन-सा मौजूदा अकाउंट प्रमोट किए गए मान प्राप्त करेगा

<Note>
Matrix वर्तमान बंडल किया गया उदाहरण है। यदि ठीक एक नामित Matrix अकाउंट पहले से मौजूद है, या यदि `defaultAccount` किसी मौजूदा गैर-कैनोनिकल कुंजी जैसे `Ops` की ओर संकेत करता है, तो प्रमोशन नई `accounts.default` एंट्री बनाने के बजाय उस अकाउंट को संरक्षित रखता है।
</Note>

## कॉन्फ़िगरेशन स्कीमा

Plugin कॉन्फ़िगरेशन आपके मैनिफ़ेस्ट में दिए गए JSON Schema के विरुद्ध सत्यापित किया जाता है। उपयोगकर्ता Plugin को इस प्रकार कॉन्फ़िगर करते हैं:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

पंजीकरण के दौरान आपके Plugin को यह कॉन्फ़िगरेशन `api.pluginConfig` के रूप में प्राप्त होता है।

चैनल-विशिष्ट कॉन्फ़िगरेशन के लिए इसके बजाय चैनल कॉन्फ़िगरेशन अनुभाग का उपयोग करें:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### चैनल कॉन्फ़िगरेशन स्कीमा बनाना

Zod स्कीमा को Plugin-स्वामित्व वाली कॉन्फ़िगरेशन कलाकृतियों द्वारा उपयोग किए जाने वाले `ChannelConfigSchema` रैपर में बदलने के लिए `buildChannelConfigSchema` का उपयोग करें:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

यदि आप अनुबंध को पहले से JSON Schema या TypeBox के रूप में लिखते हैं, तो प्रत्यक्ष हेल्पर का उपयोग करें, ताकि OpenClaw मेटाडेटा पथों पर Zod-से-JSON-Schema रूपांतरण छोड़ सके:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

तृतीय-पक्ष Plugin के लिए, कोल्ड-पाथ अनुबंध अब भी Plugin मैनिफ़ेस्ट ही है: उत्पन्न JSON Schema को `openclaw.plugin.json#channelConfigs` में प्रतिबिंबित करें, ताकि कॉन्फ़िगरेशन स्कीमा, सेटअप और UI सतहें रनटाइम कोड लोड किए बिना `channels.<id>` का निरीक्षण कर सकें।

## सेटअप विज़ार्ड

चैनल Plugin, `openclaw onboard` के लिए इंटरैक्टिव सेटअप विज़ार्ड प्रदान कर सकते हैं। विज़ार्ड, `ChannelPlugin` पर एक `ChannelSetupWizard` ऑब्जेक्ट होता है:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "कनेक्टेड",
    unconfiguredLabel: "कॉन्फ़िगर नहीं किया गया",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "बॉट टोकन",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "परिवेश से MY_CHANNEL_BOT_TOKEN का उपयोग करें?",
      keepPrompt: "वर्तमान टोकन बनाए रखें?",
      inputPrompt: "अपना बॉट टोकन दर्ज करें:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, और अन्य का भी समर्थन करता है। संपूर्ण बंडल किए गए उदाहरण के लिए Discord Plugin का `src/setup-core.ts` देखें।

<AccordionGroup>
  <Accordion title="साझा allowFrom प्रॉम्प्ट">
    ऐसे DM अनुमति-सूची प्रॉम्प्ट के लिए, जिन्हें केवल मानक `note -> prompt -> parse -> merge -> patch` प्रवाह की आवश्यकता हो, `openclaw/plugin-sdk/setup` से साझा सेटअप हेल्पर को प्राथमिकता दें: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, और `createNestedChannelParsedAllowFromPrompt(...)`।
  </Accordion>
  <Accordion title="मानक चैनल सेटअप स्थिति">
    ऐसे चैनल सेटअप स्थिति ब्लॉक के लिए, जो केवल लेबल, स्कोर और वैकल्पिक अतिरिक्त पंक्तियों के अनुसार बदलते हों, हर Plugin में समान `status` ऑब्जेक्ट हाथ से बनाने के बजाय `openclaw/plugin-sdk/setup` से `createStandardChannelSetupStatus(...)` को प्राथमिकता दें।
  </Accordion>
  <Accordion title="वैकल्पिक चैनल सेटअप सतह">
    कुछ विशेष संदर्भों में ही दिखाई देने वाली वैकल्पिक सेटअप सतहों के लिए, `openclaw/plugin-sdk/channel-setup` से `createOptionalChannelSetupSurface` का उपयोग करें:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "मेरा चैनल",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // { setupAdapter, setupWizard } लौटाता है
    ```

    जब आपको उस वैकल्पिक-इंस्टॉल सतह के केवल एक भाग की आवश्यकता हो, तो `plugin-sdk/channel-setup` निम्न-स्तरीय `createOptionalChannelSetupAdapter(...)` और `createOptionalChannelSetupWizard(...)` बिल्डर भी उपलब्ध कराता है।

    जनरेट किया गया वैकल्पिक अडैप्टर/विज़ार्ड वास्तविक कॉन्फ़िगरेशन लेखन पर विफलता की स्थिति में बंद रहता है। वे `validateInput`, `applyAccountConfig`, और `finalize` में एक ही इंस्टॉलेशन-आवश्यक संदेश का पुनः उपयोग करते हैं, और `docsPath` सेट होने पर दस्तावेज़ों की लिंक जोड़ते हैं।

  </Accordion>
  <Accordion title="बाइनरी-समर्थित सेटअप सहायक">
    बाइनरी-समर्थित सेटअप UI के लिए, हर चैनल में समान बाइनरी/स्थिति संयोजन की प्रतिलिपि बनाने के बजाय साझा प्रत्यायोजित सहायकों को प्राथमिकता दें:

    - `createDetectedBinaryStatus(...)` उन स्थिति ब्लॉक के लिए जो केवल लेबल, संकेत, स्कोर और बाइनरी पहचान के अनुसार बदलते हैं
    - `createCliPathTextInput(...)` पथ-समर्थित टेक्स्ट इनपुट के लिए
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, और `createDelegatedResolveConfigured(...)`, जब `setupEntry` को आवश्यकतानुसार किसी अधिक व्यापक पूर्ण विज़ार्ड को अग्रेषित करना हो
    - `createDelegatedTextInputShouldPrompt(...)`, जब `setupEntry` को केवल किसी `textInputs[*].shouldPrompt` निर्णय को प्रत्यायोजित करना हो

  </Accordion>
</AccordionGroup>

## प्रकाशित और इंस्टॉल करना

**बाहरी plugins:** [ClawHub](/hi/clawhub) पर प्रकाशित करें, फिर इंस्टॉल करें:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    लॉन्च कटओवर के दौरान सामान्य पैकेज विनिर्देश npm से इंस्टॉल होते हैं, जब तक कि नाम किसी बंडल किए गए या आधिकारिक plugin आईडी से मेल न खाता हो; ऐसी स्थिति में OpenClaw इसके बजाय उस स्थानीय/आधिकारिक प्रति का उपयोग करता है। नियतात्मक स्रोत चयन के लिए `clawhub:`, `npm:`, `git:`, या `npm-pack:` का उपयोग करें — [plugins प्रबंधित करें](/hi/plugins/manage-plugins) देखें।

  </Tab>
  <Tab title="केवल ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm पैकेज विनिर्देश">
    जब कोई पैकेज अभी तक ClawHub पर स्थानांतरित न हुआ हो, या माइग्रेशन के दौरान आपको
    सीधे npm इंस्टॉल पथ की आवश्यकता हो, तो npm का उपयोग करें:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**रिपॉज़िटरी के भीतर के plugins:** इन्हें बंडल किए गए plugin कार्यक्षेत्र ट्री के अंतर्गत रखें; बिल्ड के दौरान इनका स्वतः पता लगाया जाता है।

<Info>
npm-स्रोत वाले इंस्टॉलेशन के लिए, `openclaw plugins install` पैकेज को `~/.openclaw/npm/projects` के अंतर्गत प्रत्येक plugin के लिए अलग प्रोजेक्ट में इंस्टॉल करता है और जीवनचक्र स्क्रिप्ट अक्षम रहती हैं (`--ignore-scripts`)। plugin निर्भरता ट्री को शुद्ध JS/TS रखें और उन पैकेज से बचें जिन्हें `postinstall` बिल्ड की आवश्यकता होती है।
</Info>

<Note>
Gateway स्टार्टअप plugin निर्भरताएँ इंस्टॉल नहीं करता। npm/git/ClawHub इंस्टॉल प्रवाह निर्भरता अभिसरण के स्वामी हैं; स्थानीय plugins की निर्भरताएँ पहले से इंस्टॉल होनी चाहिए।
</Note>

बंडल किए गए पैकेज का मेटाडेटा स्पष्ट होता है, Gateway स्टार्टअप के समय बिल्ड किए गए JavaScript से अनुमानित नहीं। रनटाइम निर्भरताएँ उसी plugin पैकेज में होनी चाहिए जो उनका स्वामी है; पैकेज किया गया OpenClaw स्टार्टअप कभी भी plugin निर्भरताओं की मरम्मत या प्रतिलिपि नहीं बनाता।

## संबंधित

- [plugins बनाना](/hi/plugins/building-plugins) — आरंभ करने के लिए चरण-दर-चरण मार्गदर्शिका
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) — पूर्ण मैनिफ़ेस्ट स्कीमा संदर्भ
- [SDK प्रवेश बिंदु](/hi/plugins/sdk-entrypoints) — `definePluginEntry` और `defineChannelPluginEntry`
