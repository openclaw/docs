---
read_when:
    - आप किसी Plugin में सेटअप विज़ार्ड जोड़ रहे हैं
    - आपको setup-entry.ts बनाम index.ts को समझना होगा
    - आप Plugin कॉन्फ़िग स्कीमा या package.json OpenClaw मेटाडेटा परिभाषित कर रहे हैं
sidebarTitle: Setup and config
summary: सेटअप विज़ार्ड, setup-entry.ts, config स्कीमा, और package.json मेटाडेटा
title: Plugin सेटअप और कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-07-04T15:19:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

प्लगइन पैकेजिंग (`package.json` मेटाडेटा), मैनिफ़ेस्ट (`openclaw.plugin.json`), सेटअप प्रविष्टियों, और कॉन्फ़िग स्कीमा के लिए संदर्भ।

<Tip>
**वॉकथ्रू खोज रहे हैं?** कैसे-करें गाइड संदर्भ में पैकेजिंग को कवर करती हैं: [Channel Plugin](/hi/plugins/sdk-channel-plugins#step-1-package-and-manifest) और [Provider Plugin](/hi/plugins/sdk-provider-plugins#step-1-package-and-manifest)।
</Tip>

## पैकेज मेटाडेटा

आपके `package.json` में एक `openclaw` फ़ील्ड चाहिए जो प्लगइन सिस्टम को बताती है कि आपका Plugin क्या प्रदान करता है:

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
यदि आप Plugin को ClawHub पर बाहरी रूप से प्रकाशित करते हैं, तो वे `compat` और `build` फ़ील्ड आवश्यक हैं। प्रामाणिक प्रकाशन स्निपेट `docs/snippets/plugin-publish/` में हैं।
</Note>

### `openclaw` फ़ील्ड

<ParamField path="extensions" type="string[]">
  प्रवेश बिंदु फ़ाइलें (पैकेज रूट के सापेक्ष)।
</ParamField>
<ParamField path="setupEntry" type="string">
  हल्की केवल-सेटअप प्रविष्टि (वैकल्पिक)।
</ParamField>
<ParamField path="channel" type="object">
  सेटअप, पिकर, क्विकस्टार्ट, और स्थिति सतहों के लिए चैनल कैटलॉग मेटाडेटा।
</ParamField>
<ParamField path="providers" type="string[]">
  इस Plugin द्वारा पंजीकृत प्रोवाइडर आईडी।
</ParamField>
<ParamField path="install" type="object">
  इंस्टॉल संकेत: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`।
</ParamField>
<ParamField path="startup" type="object">
  स्टार्टअप व्यवहार फ़्लैग।
</ParamField>

### `openclaw.channel`

`openclaw.channel` रनटाइम लोड होने से पहले चैनल खोज और सेटअप सतहों के लिए किफायती पैकेज मेटाडेटा है।

| फ़ील्ड                                  | प्रकार       | इसका अर्थ                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | प्रामाणिक चैनल आईडी।                                                         |
| `label`                                | `string`   | प्राथमिक चैनल लेबल।                                                        |
| `selectionLabel`                       | `string`   | पिकर/सेटअप लेबल, जब यह `label` से अलग होना चाहिए।                        |
| `detailLabel`                          | `string`   | समृद्ध चैनल कैटलॉग और स्थिति सतहों के लिए द्वितीयक विवरण लेबल।       |
| `docsPath`                             | `string`   | सेटअप और चयन लिंक के लिए दस्तावेज़ पथ।                                      |
| `docsLabel`                            | `string`   | दस्तावेज़ लिंक के लिए प्रयुक्त लेबल को ओवरराइड करता है, जब यह चैनल आईडी से अलग होना चाहिए। |
| `blurb`                                | `string`   | संक्षिप्त ऑनबोर्डिंग/कैटलॉग विवरण।                                         |
| `order`                                | `number`   | चैनल कैटलॉग में क्रमबद्ध करने का क्रम।                                               |
| `aliases`                              | `string[]` | चैनल चयन के लिए अतिरिक्त लुकअप उपनाम।                                   |
| `preferOver`                           | `string[]` | निम्न-प्राथमिकता वाले Plugin/चैनल आईडी जिनसे इस चैनल को ऊपर रखा जाना चाहिए।                |
| `systemImage`                          | `string`   | चैनल UI कैटलॉग के लिए वैकल्पिक आइकन/सिस्टम-इमेज नाम।                      |
| `selectionDocsPrefix`                  | `string`   | चयन सतहों में दस्तावेज़ लिंक से पहले का उपसर्ग पाठ।                          |
| `selectionDocsOmitLabel`               | `boolean`  | चयन कॉपी में लेबल वाले दस्तावेज़ लिंक के बजाय दस्तावेज़ पथ सीधे दिखाएं। |
| `selectionExtras`                      | `string[]` | चयन कॉपी में जोड़ी गई अतिरिक्त छोटी स्ट्रिंग।                               |
| `markdownCapable`                      | `boolean`  | आउटबाउंड फ़ॉर्मैटिंग निर्णयों के लिए चैनल को markdown-सक्षम के रूप में चिह्नित करता है।      |
| `exposure`                             | `object`   | सेटअप, कॉन्फ़िगर की गई सूचियों, और दस्तावेज़ सतहों के लिए चैनल दृश्यता नियंत्रण।   |
| `quickstartAllowFrom`                  | `boolean`  | इस चैनल को मानक क्विकस्टार्ट `allowFrom` सेटअप फ़्लो में शामिल करें।         |
| `forceAccountBinding`                  | `boolean`  | केवल एक अकाउंट मौजूद होने पर भी स्पष्ट अकाउंट बाइंडिंग आवश्यक करें।           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | इस चैनल के लिए घोषणा लक्ष्य हल करते समय सेशन लुकअप को प्राथमिकता दें।       |

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

- `configured`: कॉन्फ़िगर/स्थिति-शैली सूचीकरण सतहों में चैनल शामिल करें
- `setup`: इंटरैक्टिव सेटअप/कॉन्फ़िगर पिकर में चैनल शामिल करें
- `docs`: दस्तावेज़/नेविगेशन सतहों में चैनल को सार्वजनिक-उन्मुख के रूप में चिह्नित करें

<Note>
`showConfigured` और `showInSetup` legacy उपनामों के रूप में समर्थित रहते हैं। `exposure` को प्राथमिकता दें।
</Note>

### `openclaw.install`

`openclaw.install` पैकेज मेटाडेटा है, मैनिफ़ेस्ट मेटाडेटा नहीं।

| फ़ील्ड                        | प्रकार                                | इसका अर्थ                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | इंस्टॉल/अपडेट और ऑनबोर्डिंग इंस्टॉल-ऑन-डिमांड फ़्लो के लिए प्रामाणिक ClawHub स्पेक। |
| `npmSpec`                    | `string`                            | इंस्टॉल/अपडेट फ़ॉलबैक फ़्लो के लिए प्रामाणिक npm स्पेक।                             |
| `localPath`                  | `string`                            | स्थानीय डेवलपमेंट या बंडल किया गया इंस्टॉल पथ।                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | कई स्रोत उपलब्ध होने पर पसंदीदा इंस्टॉल स्रोत।                     |
| `minHostVersion`             | `string`                            | `>=x.y.z` या `>=x.y.z-prerelease` रूप में न्यूनतम समर्थित OpenClaw संस्करण। |
| `expectedIntegrity`          | `string`                            | पिन किए गए इंस्टॉल के लिए अपेक्षित npm dist इंटीग्रिटी स्ट्रिंग, आमतौर पर `sha512-...`।    |
| `allowInvalidConfigRecovery` | `boolean`                           | बंडल किए गए Plugin रीइंस्टॉल फ़्लो को विशिष्ट पुराने-कॉन्फ़िग विफलताओं से रिकवर करने देता है।  |
| `requiredPlatformPackages`   | `string[]`                          | npm इंस्टॉल के दौरान सत्यापित आवश्यक प्लेटफ़ॉर्म-विशिष्ट npm उपनाम।               |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    इंटरैक्टिव ऑनबोर्डिंग इंस्टॉल-ऑन-डिमांड सतहों के लिए भी `openclaw.install` का उपयोग करती है। यदि आपका Plugin रनटाइम लोड होने से पहले प्रोवाइडर auth विकल्प या चैनल सेटअप/कैटलॉग मेटाडेटा दिखाता है, तो ऑनबोर्डिंग वह विकल्प दिखा सकती है, ClawHub, npm, या स्थानीय इंस्टॉल के लिए पूछ सकती है, Plugin को इंस्टॉल या सक्षम कर सकती है, फिर चुने गए फ़्लो को जारी रख सकती है। ClawHub ऑनबोर्डिंग विकल्प `clawhubSpec` का उपयोग करते हैं और मौजूद होने पर प्राथमिकता पाते हैं; npm विकल्पों के लिए रजिस्ट्री `npmSpec` के साथ विश्वसनीय कैटलॉग मेटाडेटा चाहिए; सटीक संस्करण और `expectedIntegrity` वैकल्पिक npm पिन हैं। यदि `expectedIntegrity` मौजूद है, तो इंस्टॉल/अपडेट फ़्लो इसे npm के लिए लागू करते हैं। "क्या दिखाना है" मेटाडेटा `openclaw.plugin.json` में और "इसे कैसे इंस्टॉल करना है" मेटाडेटा `package.json` में रखें।
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    यदि `minHostVersion` सेट है, तो इंस्टॉल और गैर-बंडल मैनिफ़ेस्ट-रजिस्ट्री लोडिंग दोनों इसे लागू करते हैं। पुराने होस्ट बाहरी Plugin छोड़ देते हैं; अमान्य संस्करण स्ट्रिंग अस्वीकार कर दी जाती हैं। बंडल किए गए सोर्स Plugin को होस्ट चेकआउट के साथ सह-संस्करणित माना जाता है।
  </Accordion>
  <Accordion title="Pinned npm installs">
    पिन किए गए npm इंस्टॉल के लिए, सटीक संस्करण `npmSpec` में रखें और अपेक्षित आर्टिफ़ैक्ट इंटीग्रिटी जोड़ें:

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
    `allowInvalidConfigRecovery` टूटे हुए कॉन्फ़िग के लिए सामान्य बायपास नहीं है। यह केवल संकीर्ण बंडल किए गए Plugin रिकवरी के लिए है, ताकि रीइंस्टॉल/सेटअप उसी Plugin के लिए गुम बंडल Plugin पथ या पुरानी `channels.<id>` प्रविष्टि जैसे ज्ञात अपग्रेड अवशेषों को सुधार सके। यदि कॉन्फ़िग असंबंधित कारणों से टूटा है, तो इंस्टॉल अभी भी fail closed होता है और ऑपरेटर को `openclaw doctor --fix` चलाने के लिए कहता है।
  </Accordion>
</AccordionGroup>

### स्थगित पूर्ण लोड

चैनल Plugin इसके साथ स्थगित लोडिंग चुन सकते हैं:

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

सक्षम होने पर, OpenClaw प्री-लिसन स्टार्टअप चरण के दौरान केवल `setupEntry` लोड करता है, पहले से कॉन्फ़िगर किए गए चैनलों के लिए भी। पूर्ण प्रविष्टि Gateway के सुनना शुरू करने के बाद लोड होती है।

<Warning>
स्थगित लोडिंग केवल तब सक्षम करें जब आपका `setupEntry` Gateway के सुनना शुरू करने से पहले उसकी ज़रूरत की हर चीज़ पंजीकृत करता हो (चैनल पंजीकरण, HTTP रूट, Gateway मेथड)। यदि पूर्ण प्रविष्टि आवश्यक स्टार्टअप क्षमताओं की मालिक है, तो डिफ़ॉल्ट व्यवहार रखें।
</Warning>

यदि आपकी सेटअप/पूर्ण प्रविष्टि Gateway RPC मेथड पंजीकृत करती है, तो उन्हें Plugin-विशिष्ट प्रिफ़िक्स पर रखें। आरक्षित core admin namespace (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) core के स्वामित्व में रहते हैं और हमेशा `operator.admin` पर हल होते हैं।

## Plugin मैनिफ़ेस्ट

हर नेटिव Plugin को पैकेज रूट में `openclaw.plugin.json` शिप करना चाहिए। OpenClaw इसका उपयोग Plugin कोड निष्पादित किए बिना कॉन्फ़िग मान्य करने के लिए करता है।

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

चैनल Plugin के लिए, `kind` और `channels` जोड़ें:

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

यहां तक कि बिना कॉन्फ़िग वाले plugins को भी schema भेजना होगा। खाली schema मान्य है:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

पूरे schema संदर्भ के लिए [Plugin मैनिफेस्ट](/hi/plugins/manifest) देखें.

## ClawHub प्रकाशन

Plugin पैकेजों के लिए, पैकेज-विशिष्ट ClawHub कमांड का उपयोग करें:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
लेगेसी केवल-skill publish alias skills के लिए है। Plugin पैकेजों को हमेशा `clawhub package publish` का उपयोग करना चाहिए।
</Note>

## सेटअप एंट्री

`setup-entry.ts` फ़ाइल `index.ts` का हल्का विकल्प है, जिसे OpenClaw तब लोड करता है जब उसे केवल सेटअप सतहों (ऑनबोर्डिंग, कॉन्फ़िग सुधार, अक्षम चैनल निरीक्षण) की आवश्यकता होती है।

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

यह सेटअप फ्लो के दौरान भारी रनटाइम कोड (क्रिप्टो लाइब्रेरी, CLI रजिस्ट्रेशन, बैकग्राउंड सेवाएं) लोड करने से बचाता है।

बंडल किए गए workspace चैनल जो sidecar मॉड्यूल में setup-safe exports रखते हैं, वे `defineSetupPluginEntry(...)` के बजाय `openclaw/plugin-sdk/channel-entry-contract` से `defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं। वह बंडल किया गया contract वैकल्पिक `runtime` export का भी समर्थन करता है ताकि setup-time runtime wiring हल्की और स्पष्ट रह सके।

<AccordionGroup>
  <Accordion title="जब OpenClaw पूर्ण entry के बजाय setupEntry का उपयोग करता है">
    - चैनल अक्षम है लेकिन उसे सेटअप/ऑनबोर्डिंग सतहों की आवश्यकता है।
    - चैनल सक्षम है लेकिन कॉन्फ़िगर नहीं है।
    - विलंबित लोडिंग सक्षम है (`deferConfiguredChannelFullLoadUntilAfterListen`)।

  </Accordion>
  <Accordion title="setupEntry को क्या रजिस्टर करना होगा">
    - चैनल Plugin ऑब्जेक्ट (`defineSetupPluginEntry` के माध्यम से)।
    - Gateway listen से पहले आवश्यक कोई भी HTTP routes।
    - स्टार्टअप के दौरान आवश्यक कोई भी Gateway methods।

    उन startup Gateway methods को फिर भी reserved core admin namespaces जैसे `config.*` या `update.*` से बचना चाहिए।

  </Accordion>
  <Accordion title="setupEntry में क्या शामिल नहीं होना चाहिए">
    - CLI रजिस्ट्रेशन।
    - बैकग्राउंड सेवाएं।
    - भारी रनटाइम imports (क्रिप्टो, SDKs)।
    - केवल startup के बाद आवश्यक Gateway methods।

  </Accordion>
</AccordionGroup>

### सीमित सेटअप helper imports

हॉट setup-only paths के लिए, जब आपको setup surface के केवल एक भाग की आवश्यकता हो, तो व्यापक `plugin-sdk/setup` umbrella के बजाय सीमित setup helper seams को प्राथमिकता दें:

| Import path                        | इसका उपयोग किसलिए करें                                                                  | मुख्य exports                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | setup-time runtime helpers जो `setupEntry` / deferred channel startup में उपलब्ध रहते हैं | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | deprecated compatibility alias; `plugin-sdk/setup-runtime` का उपयोग करें                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | setup/install CLI/archive/docs helpers                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

जब आपको साझा setup toolbox पूरा चाहिए, जिसमें `moveSingleAccountChannelSectionToDefaultAccount(...)` जैसे config-patch helpers शामिल हों, तब व्यापक `plugin-sdk/setup` seam का उपयोग करें।

स्थिर setup wizard copy के लिए `createSetupTranslator(...)` का उपयोग करें। यह
CLI wizard locale (`OPENCLAW_LOCALE`, फिर system locale variables) का अनुसरण करता है और
English पर fallback करता है। Plugin-specific setup text को plugin-owned code में रखें और
shared catalog keys का उपयोग केवल सामान्य setup labels, status text, और official
bundled plugin setup copy के लिए करें।

setup patch adapters import पर hot-path safe रहते हैं। उनका bundled single-account promotion contract-surface lookup lazy है, इसलिए `plugin-sdk/setup-runtime` import करने से adapter के वास्तव में उपयोग होने से पहले bundled contract-surface discovery eager load नहीं होती।

### चैनल-स्वामित्व वाला single-account promotion

जब कोई चैनल single-account top-level config से `channels.<id>.accounts.*` पर upgrade करता है, तो default shared behavior promoted account-scoped values को `accounts.default` में ले जाना है।

बंडल किए गए चैनल अपनी setup contract surface के माध्यम से उस promotion को सीमित या override कर सकते हैं:

- `singleAccountKeysToMove`: अतिरिक्त top-level keys जिन्हें promoted account में जाना चाहिए
- `namedAccountPromotionKeys`: जब named accounts पहले से मौजूद हों, तो केवल ये keys promoted account में जाती हैं; shared policy/delivery keys channel root पर रहती हैं
- `resolveSingleAccountPromotionTarget(...)`: चुनें कि किस existing account को promoted values मिलेंगी

<Note>
Matrix वर्तमान bundled उदाहरण है। यदि ठीक एक named Matrix account पहले से मौजूद है, या यदि `defaultAccount` किसी existing non-canonical key जैसे `Ops` की ओर इशारा करता है, तो promotion नया `accounts.default` entry बनाने के बजाय उस account को सुरक्षित रखता है।
</Note>

## कॉन्फ़िग schema

Plugin config आपके manifest में JSON Schema के विरुद्ध validate किया जाता है। उपयोगकर्ता plugins को इसके माध्यम से configure करते हैं:

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

आपका Plugin registration के दौरान इस config को `api.pluginConfig` के रूप में प्राप्त करता है।

Channel-specific config के लिए, इसके बजाय channel config section का उपयोग करें:

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

### channel config schemas बनाना

Zod schema को plugin-owned config artifacts द्वारा उपयोग किए जाने वाले `ChannelConfigSchema` wrapper में बदलने के लिए `buildChannelConfigSchema` का उपयोग करें:

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

यदि आप contract को पहले से JSON Schema या TypeBox के रूप में author करते हैं, तो direct helper का उपयोग करें ताकि OpenClaw metadata paths पर Zod-to-JSON-Schema conversion छोड़ सके:

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

Third-party plugins के लिए, cold-path contract अभी भी plugin manifest है: generated JSON Schema को `openclaw.plugin.json#channelConfigs` में mirror करें ताकि config schema, setup, और UI surfaces runtime code load किए बिना `channels.<id>` का निरीक्षण कर सकें।

## सेटअप wizards

Channel plugins `openclaw onboard` के लिए interactive setup wizards प्रदान कर सकते हैं। wizard `ChannelPlugin` पर एक `ChannelSetupWizard` object है:

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

`ChannelSetupWizard` type `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, और अधिक का समर्थन करता है। पूरे उदाहरणों के लिए bundled plugin packages देखें (उदाहरण के लिए Discord plugin `src/channel.setup.ts`)।

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    DM allowlist prompts के लिए जिन्हें केवल standard `note -> prompt -> parse -> merge -> patch` flow की आवश्यकता है, `openclaw/plugin-sdk/setup` से shared setup helpers को प्राथमिकता दें: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, और `createNestedChannelParsedAllowFromPrompt(...)`।
  </Accordion>
  <Accordion title="Standard channel setup status">
    Channel setup status blocks के लिए जो केवल labels, scores, और वैकल्पिक extra lines के अनुसार बदलते हैं, हर Plugin में वही `status` object हाथ से बनाने के बजाय `openclaw/plugin-sdk/setup` से `createStandardChannelSetupStatus(...)` को प्राथमिकता दें।
  </Accordion>
  <Accordion title="Optional channel setup surface">
    वैकल्पिक setup surfaces के लिए जो केवल कुछ contexts में दिखाई देनी चाहिए, `openclaw/plugin-sdk/channel-setup` से `createOptionalChannelSetupSurface` का उपयोग करें:

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

    `plugin-sdk/channel-setup` lower-level `createOptionalChannelSetupAdapter(...)` और `createOptionalChannelSetupWizard(...)` builders भी expose करता है, जब आपको उस optional-install surface के केवल एक हिस्से की आवश्यकता हो।

    generated optional adapter/wizard वास्तविक config writes पर fail closed करते हैं। वे `validateInput`, `applyAccountConfig`, और `finalize` में एक ही install-required message reuse करते हैं, और `docsPath` set होने पर docs link append करते हैं।

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Binary-backed setup UIs के लिए, हर channel में वही binary/status glue copy करने के बजाय shared delegated helpers को प्राथमिकता दें:

    - `createDetectedBinaryStatus(...)` उन स्थिति ब्लॉकों के लिए जो केवल लेबल, संकेत, स्कोर, और बाइनरी पहचान के आधार पर बदलते हैं
    - `createCliPathTextInput(...)` पथ-आधारित टेक्स्ट इनपुट के लिए
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, और `createDelegatedResolveConfigured(...)` जब `setupEntry` को किसी भारी पूर्ण विज़ार्ड को आलस्यपूर्वक अग्रेषित करना हो
    - `createDelegatedTextInputShouldPrompt(...)` जब `setupEntry` को केवल `textInputs[*].shouldPrompt` निर्णय को प्रत्यायोजित करना हो

  </Accordion>
</AccordionGroup>

## प्रकाशित करना और इंस्टॉल करना

**बाहरी plugins:** [ClawHub](/clawhub) पर प्रकाशित करें, फिर इंस्टॉल करें:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    लॉन्च कटओवर के दौरान बेयर पैकेज स्पेक्स npm से इंस्टॉल होते हैं।

  </Tab>
  <Tab title="केवल ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    npm का उपयोग करें जब कोई पैकेज अभी ClawHub पर नहीं गया हो, या जब माइग्रेशन के दौरान आपको
    सीधे npm इंस्टॉल पथ की आवश्यकता हो:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**इन-रेपो plugins:** उन्हें बंडल किए गए plugin वर्कस्पेस ट्री के अंतर्गत रखें और बिल्ड के दौरान वे स्वतः खोज लिए जाते हैं।

**उपयोगकर्ता इंस्टॉल कर सकते हैं:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm-स्रोत इंस्टॉल के लिए, `openclaw plugins install` पैकेज को `~/.openclaw/npm/projects` के अंतर्गत प्रति-plugin प्रोजेक्ट में lifecycle scripts अक्षम करके इंस्टॉल करता है। plugin dependency trees को शुद्ध JS/TS रखें और ऐसे पैकेजों से बचें जिन्हें `postinstall` builds की आवश्यकता होती है।
</Info>

<Note>
Gateway स्टार्टअप plugin निर्भरताएँ इंस्टॉल नहीं करता। npm/git/ClawHub इंस्टॉल फ्लो dependency convergence के स्वामी हैं; स्थानीय plugins में उनकी निर्भरताएँ पहले से इंस्टॉल होनी चाहिए।
</Note>

बंडल किए गए पैकेज मेटाडेटा स्पष्ट होता है, gateway स्टार्टअप पर निर्मित JavaScript से अनुमानित नहीं। रनटाइम निर्भरताएँ उस plugin पैकेज में होनी चाहिए जो उनका स्वामी है; पैकेज्ड OpenClaw स्टार्टअप plugin निर्भरताओं की कभी मरम्मत या मिररिंग नहीं करता।

## संबंधित

- [plugins बनाना](/hi/plugins/building-plugins) — शुरू करने के लिए चरण-दर-चरण मार्गदर्शिका
- [Plugin manifest](/hi/plugins/manifest) — पूर्ण मेनिफेस्ट स्कीमा संदर्भ
- [SDK entry points](/hi/plugins/sdk-entrypoints) — `definePluginEntry` और `defineChannelPluginEntry`
