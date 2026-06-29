---
read_when:
    - आप किसी Plugin में सेटअप विज़ार्ड जोड़ रहे हैं
    - आपको setup-entry.ts बनाम index.ts को समझना होगा
    - आप Plugin कॉन्फ़िग स्कीमा या package.json openclaw मेटाडेटा परिभाषित कर रहे हैं
sidebarTitle: Setup and config
summary: सेटअप विज़ार्ड, setup-entry.ts, config स्कीमा, और package.json मेटाडेटा
title: Plugin सेटअप और कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-06-28T23:52:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin पैकेजिंग (`package.json` मेटाडेटा), मैनिफेस्ट (`openclaw.plugin.json`), सेटअप एंट्री, और कॉन्फ़िग स्कीमा के लिए संदर्भ।

<Tip>
**वॉकथ्रू खोज रहे हैं?** कैसे-करें गाइड संदर्भ में पैकेजिंग कवर करती हैं: [चैनल Plugins](/hi/plugins/sdk-channel-plugins#step-1-package-and-manifest) और [प्रदाता Plugins](/hi/plugins/sdk-provider-plugins#step-1-package-and-manifest)।
</Tip>

## पैकेज मेटाडेटा

आपके `package.json` को एक `openclaw` फ़ील्ड चाहिए जो Plugin सिस्टम को बताता है कि आपका Plugin क्या उपलब्ध कराता है:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
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
यदि आप Plugin को ClawHub पर बाहरी रूप से प्रकाशित करते हैं, तो वे `compat` और `build` फ़ील्ड आवश्यक हैं। कैननिकल प्रकाशन स्निपेट `docs/snippets/plugin-publish/` में हैं।
</Note>

### `openclaw` फ़ील्ड

<ParamField path="extensions" type="string[]">
  एंट्री पॉइंट फ़ाइलें (पैकेज रूट के सापेक्ष)।
</ParamField>
<ParamField path="setupEntry" type="string">
  हल्की सेटअप-केवल एंट्री (वैकल्पिक)।
</ParamField>
<ParamField path="channel" type="object">
  सेटअप, पिकर, क्विकस्टार्ट, और स्थिति सतहों के लिए चैनल कैटलॉग मेटाडेटा।
</ParamField>
<ParamField path="providers" type="string[]">
  इस Plugin द्वारा पंजीकृत प्रदाता आईडी।
</ParamField>
<ParamField path="install" type="object">
  इंस्टॉल संकेत: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`।
</ParamField>
<ParamField path="startup" type="object">
  स्टार्टअप व्यवहार फ़्लैग।
</ParamField>

### `openclaw.channel`

`openclaw.channel` रनटाइम लोड होने से पहले चैनल खोज और सेटअप सतहों के लिए सस्ता पैकेज मेटाडेटा है।

| फ़ील्ड                                  | प्रकार       | इसका अर्थ                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | कैननिकल चैनल आईडी।                                                         |
| `label`                                | `string`   | प्राथमिक चैनल लेबल।                                                        |
| `selectionLabel`                       | `string`   | पिकर/सेटअप लेबल, जब यह `label` से अलग होना चाहिए।                        |
| `detailLabel`                          | `string`   | अधिक समृद्ध चैनल कैटलॉग और स्थिति सतहों के लिए द्वितीयक विवरण लेबल।       |
| `docsPath`                             | `string`   | सेटअप और चयन लिंक के लिए दस्तावेज़ पथ।                                      |
| `docsLabel`                            | `string`   | दस्तावेज़ लिंक के लिए इस्तेमाल किया गया ओवरराइड लेबल, जब यह चैनल आईडी से अलग होना चाहिए। |
| `blurb`                                | `string`   | छोटा ऑनबोर्डिंग/कैटलॉग विवरण।                                         |
| `order`                                | `number`   | चैनल कैटलॉग में क्रम।                                               |
| `aliases`                              | `string[]` | चैनल चयन के लिए अतिरिक्त लुकअप उपनाम।                                   |
| `preferOver`                           | `string[]` | कम-प्राथमिकता वाले Plugin/चैनल आईडी जिनसे इस चैनल को ऊपर रैंक करना चाहिए।                |
| `systemImage`                          | `string`   | चैनल UI कैटलॉग के लिए वैकल्पिक आइकन/सिस्टम-इमेज नाम।                      |
| `selectionDocsPrefix`                  | `string`   | चयन सतहों में दस्तावेज़ लिंक से पहले का उपसर्ग टेक्स्ट।                          |
| `selectionDocsOmitLabel`               | `boolean`  | चयन कॉपी में लेबल वाले दस्तावेज़ लिंक के बजाय दस्तावेज़ पथ सीधे दिखाएँ। |
| `selectionExtras`                      | `string[]` | चयन कॉपी में जोड़ी गई अतिरिक्त छोटी स्ट्रिंग।                               |
| `markdownCapable`                      | `boolean`  | आउटबाउंड फ़ॉर्मैटिंग निर्णयों के लिए चैनल को मार्कडाउन-सक्षम चिह्नित करता है।      |
| `exposure`                             | `object`   | सेटअप, कॉन्फ़िगर की गई सूचियों, और दस्तावेज़ सतहों के लिए चैनल दृश्यता नियंत्रण।   |
| `quickstartAllowFrom`                  | `boolean`  | इस चैनल को मानक क्विकस्टार्ट `allowFrom` सेटअप फ़्लो में शामिल करें।         |
| `forceAccountBinding`                  | `boolean`  | केवल एक खाता मौजूद होने पर भी स्पष्ट खाता बाइंडिंग आवश्यक करें।           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | इस चैनल के लिए घोषणा लक्ष्य हल करते समय सत्र लुकअप को प्राथमिकता दें।       |

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

`exposure` समर्थन करता है:

- `configured`: चैनल को कॉन्फ़िगर की गई/स्थिति-शैली सूची सतहों में शामिल करें
- `setup`: चैनल को इंटरैक्टिव सेटअप/कॉन्फ़िगर पिकर में शामिल करें
- `docs`: चैनल को दस्तावेज़/नेविगेशन सतहों में सार्वजनिक-फेसिंग के रूप में चिह्नित करें

<Note>
`showConfigured` और `showInSetup` लेगेसी उपनामों के रूप में समर्थित रहते हैं। `exposure` को प्राथमिकता दें।
</Note>

### `openclaw.install`

`openclaw.install` पैकेज मेटाडेटा है, मैनिफेस्ट मेटाडेटा नहीं।

| फ़ील्ड                        | प्रकार                                | इसका अर्थ                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | इंस्टॉल/अपडेट और ऑनबोर्डिंग इंस्टॉल-ऑन-डिमांड फ़्लो के लिए कैननिकल ClawHub स्पेक। |
| `npmSpec`                    | `string`                            | इंस्टॉल/अपडेट फ़ॉलबैक फ़्लो के लिए कैननिकल npm स्पेक।                             |
| `localPath`                  | `string`                            | स्थानीय विकास या बंडल किया गया इंस्टॉल पथ।                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | जब कई स्रोत उपलब्ध हों तो पसंदीदा इंस्टॉल स्रोत।                     |
| `minHostVersion`             | `string`                            | `>=x.y.z` या `>=x.y.z-prerelease` के रूप में न्यूनतम समर्थित OpenClaw संस्करण। |
| `expectedIntegrity`          | `string`                            | पिन किए गए इंस्टॉल के लिए अपेक्षित npm डिस्ट इंटीग्रिटी स्ट्रिंग, आमतौर पर `sha512-...`।    |
| `allowInvalidConfigRecovery` | `boolean`                           | बंडल किए गए-Plugin रीइंस्टॉल फ़्लो को विशिष्ट पुराने-कॉन्फ़िग विफलताओं से रिकवर करने देता है।  |
| `requiredPlatformPackages`   | `string[]`                          | npm इंस्टॉल के दौरान सत्यापित आवश्यक प्लेटफ़ॉर्म-विशिष्ट npm उपनाम।               |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    इंटरैक्टिव ऑनबोर्डिंग इंस्टॉल-ऑन-डिमांड सतहों के लिए भी `openclaw.install` का उपयोग करती है। यदि आपका Plugin रनटाइम लोड होने से पहले प्रदाता ऑथ विकल्प या चैनल सेटअप/कैटलॉग मेटाडेटा एक्सपोज़ करता है, तो ऑनबोर्डिंग वह विकल्प दिखा सकती है, ClawHub, npm, या स्थानीय इंस्टॉल के लिए पूछ सकती है, Plugin को इंस्टॉल या सक्षम कर सकती है, फिर चयनित फ़्लो जारी रख सकती है। ClawHub ऑनबोर्डिंग विकल्प `clawhubSpec` का उपयोग करते हैं और मौजूद होने पर प्राथमिकता पाते हैं; npm विकल्पों के लिए रजिस्ट्री `npmSpec` के साथ भरोसेमंद कैटलॉग मेटाडेटा चाहिए; सटीक संस्करण और `expectedIntegrity` वैकल्पिक npm पिन हैं। यदि `expectedIntegrity` मौजूद है, तो इंस्टॉल/अपडेट फ़्लो इसे npm के लिए लागू करते हैं। "क्या दिखाना है" मेटाडेटा `openclaw.plugin.json` में और "इसे कैसे इंस्टॉल करना है" मेटाडेटा `package.json` में रखें।
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    यदि `minHostVersion` सेट है, तो इंस्टॉल और गैर-बंडल मैनिफेस्ट-रजिस्ट्री लोडिंग दोनों इसे लागू करते हैं। पुराने होस्ट बाहरी Plugins को छोड़ देते हैं; अमान्य संस्करण स्ट्रिंग अस्वीकार कर दी जाती हैं। बंडल किए गए स्रोत Plugins को होस्ट चेकआउट के साथ समान-संस्करण माना जाता है।
  </Accordion>
  <Accordion title="Pinned npm installs">
    पिन किए गए npm इंस्टॉल के लिए, सटीक संस्करण `npmSpec` में रखें और अपेक्षित आर्टिफैक्ट इंटीग्रिटी जोड़ें:

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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` टूटे हुए कॉन्फ़िग के लिए सामान्य बाइपास नहीं है। यह केवल संकीर्ण बंडल किए गए-Plugin रिकवरी के लिए है, ताकि रीइंस्टॉल/सेटअप उसी Plugin के लिए गायब बंडल किए गए Plugin पथ या पुराने `channels.<id>` एंट्री जैसे ज्ञात अपग्रेड अवशेषों की मरम्मत कर सके। यदि कॉन्फ़िग असंबंधित कारणों से टूटा है, तो इंस्टॉल फिर भी बंद होकर विफल होता है और ऑपरेटर को `openclaw doctor --fix` चलाने को कहता है।
  </Accordion>
</AccordionGroup>

### विलंबित पूर्ण लोड

चैनल Plugins विलंबित लोडिंग को इस तरह ऑप्ट इन कर सकते हैं:

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

सक्षम होने पर, OpenClaw प्री-लिसन स्टार्टअप चरण के दौरान केवल `setupEntry` लोड करता है, यहां तक कि पहले से कॉन्फ़िगर किए गए चैनलों के लिए भी। पूर्ण एंट्री gateway के सुनना शुरू करने के बाद लोड होती है।

<Warning>
विलंबित लोडिंग केवल तब सक्षम करें जब आपका `setupEntry` वह सब कुछ पंजीकृत करता है जिसकी gateway को सुनना शुरू करने से पहले आवश्यकता होती है (चैनल पंजीकरण, HTTP रूट, gateway मेथड)। यदि पूर्ण एंट्री आवश्यक स्टार्टअप क्षमताओं की मालिक है, तो डिफ़ॉल्ट व्यवहार रखें।
</Warning>

यदि आपकी सेटअप/पूर्ण एंट्री gateway RPC मेथड पंजीकृत करती है, तो उन्हें Plugin-विशिष्ट उपसर्ग पर रखें। आरक्षित कोर एडमिन नेमस्पेस (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) कोर-स्वामित्व में रहते हैं और हमेशा `operator.admin` पर हल होते हैं।

## Plugin मैनिफेस्ट

हर नेटिव Plugin को पैकेज रूट में एक `openclaw.plugin.json` शिप करना होगा। OpenClaw इसका उपयोग Plugin कोड चलाए बिना कॉन्फ़िग सत्यापित करने के लिए करता है।

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

चैनल Plugins के लिए, `kind` और `channels` जोड़ें:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

बिना कॉन्फ़िग वाले Plugins को भी स्कीमा शिप करना होगा। खाली स्कीमा मान्य है:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

पूर्ण स्कीमा संदर्भ के लिए [Plugin manifest](/hi/plugins/manifest) देखें।

## ClawHub प्रकाशन

Plugin पैकेजों के लिए, पैकेज-विशिष्ट ClawHub कमांड का उपयोग करें:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
पुराना केवल-Skills प्रकाशन उपनाम Skills के लिए है। Plugin पैकेजों को हमेशा `clawhub package publish` का उपयोग करना चाहिए।
</Note>

## सेटअप एंट्री

`setup-entry.ts` फ़ाइल `index.ts` का हल्का विकल्प है, जिसे OpenClaw तब लोड करता है जब उसे केवल सेटअप सतहों की आवश्यकता होती है (ऑनबोर्डिंग, कॉन्फ़िग मरम्मत, अक्षम चैनल निरीक्षण)।

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

यह सेटअप फ़्लो के दौरान भारी रनटाइम कोड (क्रिप्टो लाइब्रेरी, CLI पंजीकरण, पृष्ठभूमि सेवाएँ) लोड करने से बचाता है।

बंडल किए गए वर्कस्पेस चैनल, जो सेटअप-सुरक्षित निर्यातों को साइडकार मॉड्यूल में रखते हैं, `defineSetupPluginEntry(...)` के बजाय `openclaw/plugin-sdk/channel-entry-contract` से `defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं। वह बंडल अनुबंध एक वैकल्पिक `runtime` निर्यात का भी समर्थन करता है, ताकि सेटअप-समय रनटाइम वायरिंग हल्की और स्पष्ट रह सके।

<AccordionGroup>
  <Accordion title="जब OpenClaw पूर्ण एंट्री के बजाय setupEntry का उपयोग करता है">
    - चैनल अक्षम है, लेकिन उसे सेटअप/ऑनबोर्डिंग सतहों की आवश्यकता है।
    - चैनल सक्षम है, लेकिन कॉन्फ़िगर नहीं किया गया है।
    - विलंबित लोडिंग सक्षम है (`deferConfiguredChannelFullLoadUntilAfterListen`)।

  </Accordion>
  <Accordion title="setupEntry को क्या पंजीकृत करना चाहिए">
    - चैनल Plugin ऑब्जेक्ट (`defineSetupPluginEntry` के माध्यम से)।
    - Gateway listen से पहले आवश्यक कोई भी HTTP रूट।
    - स्टार्टअप के दौरान आवश्यक कोई भी Gateway मेथड।

    उन स्टार्टअप Gateway मेथड को फिर भी `config.*` या `update.*` जैसे आरक्षित कोर एडमिन नेमस्पेस से बचना चाहिए।

  </Accordion>
  <Accordion title="setupEntry में क्या शामिल नहीं होना चाहिए">
    - CLI पंजीकरण।
    - पृष्ठभूमि सेवाएँ।
    - भारी रनटाइम इंपोर्ट (क्रिप्टो, SDKs)।
    - केवल स्टार्टअप के बाद आवश्यक Gateway मेथड।

  </Accordion>
</AccordionGroup>

### संकीर्ण सेटअप हेल्पर इंपोर्ट

हॉट सेटअप-केवल पाथ के लिए, जब आपको सेटअप सतह के केवल एक भाग की आवश्यकता हो, तो व्यापक `plugin-sdk/setup` अम्ब्रेला के बजाय संकीर्ण सेटअप हेल्पर सीम को प्राथमिकता दें:

| इंपोर्ट पाथ                        | इसका उपयोग किसके लिए करें                                                                                | मुख्य निर्यात                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | सेटअप-समय रनटाइम हेल्पर जो `setupEntry` / विलंबित चैनल स्टार्टअप में उपलब्ध रहते हैं | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | अप्रचलित संगतता उपनाम; `plugin-sdk/setup-runtime` का उपयोग करें                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | सेटअप/इंस्टॉल CLI/आर्काइव/दस्तावेज़ हेल्पर                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

जब आपको साझा सेटअप टूलबॉक्स पूरा चाहिए, जिसमें `moveSingleAccountChannelSectionToDefaultAccount(...)` जैसे कॉन्फ़िग-पैच हेल्पर शामिल हों, तो व्यापक `plugin-sdk/setup` सीम का उपयोग करें।

स्थिर सेटअप विज़ार्ड कॉपी के लिए `createSetupTranslator(...)` का उपयोग करें। यह
CLI विज़ार्ड लोकेल (`OPENCLAW_LOCALE`, फिर सिस्टम लोकेल वेरिएबल) का पालन करता है और
अंग्रेज़ी पर वापस जाता है। Plugin-विशिष्ट सेटअप टेक्स्ट को Plugin-स्वामित्व वाले कोड में रखें और
साझा कैटलॉग कुंजियों का उपयोग केवल सामान्य सेटअप लेबल, स्थिति टेक्स्ट, और आधिकारिक
बंडल किए गए Plugin सेटअप कॉपी के लिए करें।

सेटअप पैच अडैप्टर इंपोर्ट पर हॉट-पाथ सुरक्षित रहते हैं। उनका बंडल किया गया एकल-अकाउंट प्रमोशन अनुबंध-सतह लुकअप आलसी है, इसलिए `plugin-sdk/setup-runtime` इंपोर्ट करने से अडैप्टर के वास्तव में उपयोग होने से पहले बंडल अनुबंध-सतह डिस्कवरी तुरंत लोड नहीं होती।

### चैनल-स्वामित्व वाला एकल-अकाउंट प्रमोशन

जब कोई चैनल एकल-अकाउंट टॉप-लेवल कॉन्फ़िग से `channels.<id>.accounts.*` में अपग्रेड करता है, तो डिफ़ॉल्ट साझा व्यवहार प्रमोट किए गए अकाउंट-स्कोप्ड मानों को `accounts.default` में ले जाना है।

बंडल किए गए चैनल अपने सेटअप अनुबंध सतह के माध्यम से उस प्रमोशन को संकीर्ण या ओवरराइड कर सकते हैं:

- `singleAccountKeysToMove`: अतिरिक्त टॉप-लेवल कुंजियाँ जिन्हें प्रमोट किए गए अकाउंट में जाना चाहिए
- `namedAccountPromotionKeys`: जब नामित अकाउंट पहले से मौजूद हों, तो केवल ये कुंजियाँ प्रमोट किए गए अकाउंट में जाती हैं; साझा नीति/डिलीवरी कुंजियाँ चैनल रूट पर रहती हैं
- `resolveSingleAccountPromotionTarget(...)`: चुनें कि कौन सा मौजूदा अकाउंट प्रमोट किए गए मान प्राप्त करता है

<Note>
Matrix वर्तमान बंडल उदाहरण है। यदि ठीक एक नामित Matrix अकाउंट पहले से मौजूद है, या यदि `defaultAccount` `Ops` जैसी मौजूदा गैर-कैनोनिकल कुंजी की ओर इशारा करता है, तो प्रमोशन नया `accounts.default` एंट्री बनाने के बजाय उस अकाउंट को संरक्षित रखता है।
</Note>

## कॉन्फ़िग स्कीमा

Plugin कॉन्फ़िग आपके मैनिफ़ेस्ट में JSON Schema के विरुद्ध वैलिडेट किया जाता है। उपयोगकर्ता Plugin को इसके माध्यम से कॉन्फ़िगर करते हैं:

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

आपका Plugin पंजीकरण के दौरान यह कॉन्फ़िग `api.pluginConfig` के रूप में प्राप्त करता है।

चैनल-विशिष्ट कॉन्फ़िग के लिए, इसके बजाय चैनल कॉन्फ़िग सेक्शन का उपयोग करें:

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

### चैनल कॉन्फ़िग स्कीमा बनाना

Plugin-स्वामित्व वाले कॉन्फ़िग आर्टिफ़ैक्ट द्वारा उपयोग किए जाने वाले `ChannelConfigSchema` रैपर में Zod स्कीमा बदलने के लिए `buildChannelConfigSchema` का उपयोग करें:

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

यदि आप पहले से अनुबंध को JSON Schema या TypeBox के रूप में लिखते हैं, तो सीधे हेल्पर का उपयोग करें ताकि OpenClaw मेटाडेटा पाथ पर Zod-से-JSON-Schema रूपांतरण छोड़ सके:

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

तृतीय-पक्ष Plugin के लिए, कोल्ड-पाथ अनुबंध अब भी Plugin मैनिफ़ेस्ट है: जनरेट किए गए JSON Schema को `openclaw.plugin.json#channelConfigs` में मिरर करें, ताकि कॉन्फ़िग स्कीमा, सेटअप, और UI सतहें रनटाइम कोड लोड किए बिना `channels.<id>` का निरीक्षण कर सकें।

## सेटअप विज़ार्ड

चैनल Plugin `openclaw onboard` के लिए इंटरैक्टिव सेटअप विज़ार्ड दे सकते हैं। विज़ार्ड `ChannelPlugin` पर एक `ChannelSetupWizard` ऑब्जेक्ट होता है:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

`ChannelSetupWizard` प्रकार `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, और अन्य का समर्थन करता है। पूर्ण उदाहरणों के लिए बंडल किए गए Plugin पैकेज देखें (उदाहरण के लिए Discord Plugin `src/channel.setup.ts`)।

<AccordionGroup>
  <Accordion title="साझा allowFrom प्रॉम्प्ट">
    DM अलाउलिस्ट प्रॉम्प्ट के लिए जिन्हें केवल मानक `note -> prompt -> parse -> merge -> patch` फ़्लो की आवश्यकता होती है, `openclaw/plugin-sdk/setup` से साझा सेटअप हेल्पर को प्राथमिकता दें: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, और `createNestedChannelParsedAllowFromPrompt(...)`।
  </Accordion>
  <Accordion title="मानक चैनल सेटअप स्थिति">
    चैनल सेटअप स्थिति ब्लॉक के लिए जो केवल लेबल, स्कोर, और वैकल्पिक अतिरिक्त पंक्तियों से बदलते हैं, हर Plugin में वही `status` ऑब्जेक्ट हाथ से बनाने के बजाय `openclaw/plugin-sdk/setup` से `createStandardChannelSetupStatus(...)` को प्राथमिकता दें।
  </Accordion>
  <Accordion title="वैकल्पिक चैनल सेटअप सतह">
    वैकल्पिक सेटअप सतहों के लिए जो केवल कुछ संदर्भों में दिखनी चाहिए, `openclaw/plugin-sdk/channel-setup` से `createOptionalChannelSetupSurface` का उपयोग करें:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Returns { setupAdapter, setupWizard }
    ```

    जब आपको उस वैकल्पिक-इंस्टॉल सतह के केवल एक हिस्से की आवश्यकता हो, तो `plugin-sdk/channel-setup` निम्न-स्तरीय `createOptionalChannelSetupAdapter(...)` और `createOptionalChannelSetupWizard(...)` बिल्डर भी उपलब्ध कराता है।

    जनरेट किए गए वैकल्पिक अडैप्टर/विज़ार्ड वास्तविक कॉन्फ़िग राइट पर fail closed करते हैं। वे `validateInput`, `applyAccountConfig`, और `finalize` में एक ही install-required संदेश का पुनः उपयोग करते हैं, और `docsPath` सेट होने पर दस्तावेज़ लिंक जोड़ते हैं।

  </Accordion>
  <Accordion title="बाइनरी-समर्थित सेटअप हेल्पर">
    बाइनरी-समर्थित सेटअप UI के लिए, हर चैनल में वही बाइनरी/स्थिति glue कॉपी करने के बजाय साझा प्रत्यायोजित हेल्पर को प्राथमिकता दें:

    - `createDetectedBinaryStatus(...)` उन स्थिति ब्लॉक के लिए जो केवल लेबल, संकेत, स्कोर, और बाइनरी डिटेक्शन से बदलते हैं
    - `createCliPathTextInput(...)` पाथ-समर्थित टेक्स्ट इनपुट के लिए
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, और `createDelegatedResolveConfigured(...)` जब `setupEntry` को आलसी रूप से किसी भारी पूर्ण विज़ार्ड को फ़ॉरवर्ड करना हो
    - `createDelegatedTextInputShouldPrompt(...)` जब `setupEntry` को केवल `textInputs[*].shouldPrompt` निर्णय प्रत्यायोजित करना हो

  </Accordion>
</AccordionGroup>

## प्रकाशित करना और इंस्टॉल करना

**बाहरी Plugin:** [ClawHub](/hi/clawhub) पर प्रकाशित करें, फिर इंस्टॉल करें:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    लॉन्च कटओवर के दौरान बेयर पैकेज स्पेक npm से इंस्टॉल होते हैं।

  </Tab>
  <Tab title="केवल ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm पैकेज स्पेक">
    जब कोई पैकेज अभी ClawHub पर नहीं गया हो, या माइग्रेशन के दौरान आपको सीधे
    npm इंस्टॉल पथ की आवश्यकता हो, तब npm का उपयोग करें:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**रेपो के भीतर के Plugin:** इन्हें बंडल किए गए Plugin वर्कस्पेस ट्री के अंतर्गत रखें और बिल्ड के दौरान ये अपने आप खोज लिए जाते हैं।

**उपयोगकर्ता इंस्टॉल कर सकते हैं:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm-स्रोत वाले इंस्टॉल के लिए, `openclaw plugins install` पैकेज को `~/.openclaw/npm/projects` के अंतर्गत प्रति-Plugin प्रोजेक्ट में इंस्टॉल करता है, जिसमें लाइफसाइकल स्क्रिप्ट अक्षम रहती हैं। Plugin निर्भरता ट्री को शुद्ध JS/TS रखें और ऐसे पैकेजों से बचें जिन्हें `postinstall` बिल्ड की आवश्यकता होती है।
</Info>

<Note>
Gateway स्टार्टअप Plugin निर्भरताएं इंस्टॉल नहीं करता। npm/git/ClawHub इंस्टॉल फ्लो निर्भरता अभिसरण के स्वामी हैं; स्थानीय Plugin की निर्भरताएं पहले से इंस्टॉल होनी चाहिए।
</Note>

बंडल किए गए पैकेज मेटाडेटा स्पष्ट होता है, Gateway स्टार्टअप पर बने हुए JavaScript से अनुमानित नहीं। रनटाइम निर्भरताएं उसी Plugin पैकेज में होनी चाहिए जो उनका स्वामी है; पैकेज किया हुआ OpenClaw स्टार्टअप Plugin निर्भरताओं की कभी मरम्मत या मिररिंग नहीं करता।

## संबंधित

- [Plugin बनाना](/hi/plugins/building-plugins) — शुरू करने के लिए चरण-दर-चरण गाइड
- [Plugin मेनिफेस्ट](/hi/plugins/manifest) — पूरा मेनिफेस्ट स्कीमा संदर्भ
- [SDK एंट्री पॉइंट](/hi/plugins/sdk-entrypoints) — `definePluginEntry` और `defineChannelPluginEntry`
