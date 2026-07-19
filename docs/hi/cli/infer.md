---
read_when:
    - '`openclaw infer` कमांड जोड़ना या संशोधित करना'
    - स्थिर हेडलेस क्षमता स्वचालन की रूपरेखा बनाना
summary: प्रदाता-समर्थित मॉडल, इमेज, ऑडियो, TTS, वीडियो, वेब और एम्बेडिंग वर्कफ़्लो के लिए पहले अनुमान लगाने वाला CLI
title: इन्फ़रेंस CLI
x-i18n:
    generated_at: "2026-07-19T08:16:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3147bb516a08e12c4eacd6bd527af62049ecae25b5fde9439da6a4431c147b07
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` प्रदाता-समर्थित अनुमान के लिए मानक हेडलेस सतह है। यह अपरिष्कृत gateway RPC नाम या एजेंट टूल आईडी नहीं, बल्कि क्षमता परिवारों (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`) को उजागर करता है। `openclaw capability ...` उसी कमांड ट्री का उपनाम है।

किसी एकबारगी प्रदाता रैपर के बजाय इसे प्राथमिकता देने के कारण:

- OpenClaw में पहले से कॉन्फ़िगर किए गए प्रदाताओं और मॉडलों का पुनः उपयोग करता है।
- स्क्रिप्ट और एजेंट-संचालित स्वचालन के लिए स्थिर `--json` एनवेलप ([JSON आउटपुट](#json-output) देखें)।
- अधिकांश उपकमांड के लिए gateway के बिना सामान्य स्थानीय पथ चलाता है।
- सिरे-से-सिरे तक प्रदाता जाँच के लिए, प्रदाता अनुरोध भेजे जाने से पहले यह वितरित CLI, कॉन्फ़िगरेशन लोडिंग, डिफ़ॉल्ट-एजेंट समाधान, बंडल किए गए Plugin सक्रियण और साझा क्षमता रनटाइम का उपयोग करता है।

## infer को एक skill में बदलें

इसे कॉपी करके किसी एजेंट में पेस्ट करें:

```text
https://docs.openclaw.ai/cli/infer पढ़ें, फिर एक ऐसा skill बनाएँ जो मेरे सामान्य कार्यप्रवाहों को `openclaw infer` पर रूट करे।
मॉडल रन, इमेज जनरेशन, वीडियो जनरेशन, ऑडियो ट्रांसक्रिप्शन, TTS, वेब खोज और एम्बेडिंग पर ध्यान दें।
```

एक अच्छा infer-आधारित skill सामान्य उपयोगकर्ता अभिप्रायों को सही उपकमांड से मैप करता है, प्रत्येक कार्यप्रवाह के लिए कुछ मानक उदाहरण शामिल करता है, निम्न-स्तरीय विकल्पों के बजाय `openclaw infer ...` को प्राथमिकता देता है और skill के मुख्य भाग में संपूर्ण infer सतह का फिर से दस्तावेज़ीकरण नहीं करता।

## कमांड ट्री

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    personas
    status
    enable
    disable
    set-provider
    set-persona

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

`infer list` / `infer inspect --name <capability>` इस ट्री को डेटा (क्षमता आईडी, ट्रांसपोर्ट, विवरण) के रूप में दिखाते हैं।

## सामान्य कार्य

| कार्य                          | कमांड                                                                                       | टिप्पणियाँ                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| टेक्स्ट/मॉडल प्रॉम्प्ट चलाएँ       | `openclaw infer model run --prompt "..." --json`                                              | डिफ़ॉल्ट रूप से स्थानीय                                      |
| इमेज पर मॉडल प्रॉम्प्ट चलाएँ  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | एकाधिक इमेज के लिए `--file` दोहराएँ                   |
| इमेज जनरेट करें             | `openclaw infer image generate --prompt "..." --json`                                         | किसी मौजूदा फ़ाइल से शुरू करते समय `image edit` का उपयोग करें  |
| किसी इमेज फ़ाइल या URL का वर्णन करें | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` इमेज-सक्षम `<provider/model>` होना चाहिए |
| ऑडियो ट्रांसक्राइब करें              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` को `<provider/model>` होना चाहिए                  |
| वाणी संश्लेषित करें             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` केवल gateway के माध्यम से चलता है            |
| वीडियो जनरेट करें              | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` जैसे प्रदाता संकेतों का समर्थन करता है        |
| किसी वीडियो फ़ाइल का वर्णन करें         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` को `<provider/model>` होना चाहिए                  |
| वेब पर खोजें                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| वेब पेज प्राप्त करें              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| एम्बेडिंग बनाएँ             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## व्यवहार

- जब आउटपुट किसी अन्य कमांड या स्क्रिप्ट के इनपुट के रूप में उपयोग हो, तब `--json` का उपयोग करें; अन्यथा टेक्स्ट आउटपुट का उपयोग करें।
- किसी विशिष्ट बैकएंड को निर्धारित करने के लिए `--provider` या `--model provider/model` का उपयोग करें।
- एकबारगी चिंतन/तर्क ओवरराइड के लिए `model run --thinking <level>` का उपयोग करें: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, या `max`।
- `image describe`, `audio transcribe` और `video describe` के लिए, `--model` को `<provider/model>` प्रारूप का उपयोग करना चाहिए।
- `image describe` के लिए, `--file` स्थानीय पथ और HTTP(S) URL स्वीकार करता है; दूरस्थ URL सामान्य मीडिया-फ़ेच SSRF नीति से होकर गुजरते हैं।
- स्थितिविहीन निष्पादन कमांड (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) डिफ़ॉल्ट रूप से स्थानीय होते हैं। Gateway-प्रबंधित स्थिति कमांड (`tts status`) डिफ़ॉल्ट रूप से gateway का उपयोग करते हैं।
- स्थानीय पथ के लिए gateway का चलना कभी आवश्यक नहीं होता।
- स्थानीय `model run` एक हल्का एकबारगी प्रदाता कम्प्लीशन है: यह कॉन्फ़िगर किए गए एजेंट मॉडल और प्रमाणीकरण का समाधान करता है, लेकिन चैट-एजेंट टर्न शुरू नहीं करता, टूल लोड नहीं करता या बंडल किए गए MCP सर्वर नहीं खोलता।
- `model run --file` प्रॉम्प्ट में इमेज फ़ाइलें (स्वतः पहचाने गए MIME प्रकार सहित) संलग्न करता है; एकाधिक इमेज के लिए `--file` दोहराएँ। गैर-इमेज फ़ाइलें अस्वीकार कर दी जाती हैं — इसके बजाय `infer audio transcribe` या `infer video describe` का उपयोग करें।
- `model run --gateway` Gateway रूटिंग, सहेजा गया प्रमाणीकरण, प्रदाता चयन और एम्बेडेड रनटाइम का उपयोग करता है, लेकिन एक अपरिष्कृत मॉडल जाँच ही बना रहता है: कोई पिछला सत्र ट्रांसक्रिप्ट, बूटस्ट्रैप/AGENTS संदर्भ, टूल या बंडल किए गए MCP सर्वर नहीं।
- `model run --gateway --model <provider/model>` के लिए विश्वसनीय-ऑपरेटर gateway क्रेडेंशियल आवश्यक है, क्योंकि यह Gateway से एकबारगी प्रदाता/मॉडल ओवरराइड चलाने के लिए कहता है।

## मॉडल

टेक्स्ट अनुमान और मॉडल/प्रदाता निरीक्षण।

```bash
openclaw infer model run --prompt "ठीक इसी तरह उत्तर दें: smoke-ok" --json
openclaw infer model run --prompt "इस चेंजलॉग प्रविष्टि का सारांश दें" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "इस इमेज का एक वाक्य में वर्णन करें" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "यहाँ अधिक तर्क का उपयोग करें" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Gateway शुरू किए बिना या एजेंट टूल सतह लोड किए बिना किसी एक प्रदाता का स्मोक परीक्षण करने के लिए `--local` के साथ पूर्ण `<provider/model>` संदर्भों का उपयोग करें:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "ठीक इसी तरह उत्तर दें: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "ठीक इसी तरह उत्तर दें: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "ठीक इसी तरह उत्तर दें: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "ठीक इसी तरह उत्तर दें: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "ठीक इसी तरह उत्तर दें: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "ठीक इसी तरह उत्तर दें: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "ठीक इसी तरह उत्तर दें: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "इस इमेज का वर्णन करें।" --file ./photo.jpg --json
```

टिप्पणियाँ:

- स्थानीय `model run` प्रदाता/मॉडल/प्रमाणीकरण स्वास्थ्य के लिए सबसे संकीर्ण CLI स्मोक परीक्षण है: गैर-ChatGPT-Codex प्रदाताओं के लिए यह केवल दिया गया प्रॉम्प्ट भेजता है।
- स्थानीय `model run --model <provider/model>` उस प्रदाता को कॉन्फ़िगरेशन में लिखे जाने से पहले सटीक बंडल की गई स्थिर-कैटलॉग पंक्तियों (वही पंक्तियाँ जो `openclaw models list --all` दिखाता है) का समाधान कर सकता है। प्रदाता प्रमाणीकरण अभी भी आवश्यक है; अनुपलब्ध क्रेडेंशियल `Unknown model` के बजाय प्रमाणीकरण त्रुटियों के रूप में विफल होते हैं।
- Mistral Medium 3.5 तर्क जाँच के लिए, तापमान को अनिर्धारित/डिफ़ॉल्ट रहने दें। Mistral `reasoning_effort="high"` को `temperature: 0` के साथ अस्वीकार करता है; डिफ़ॉल्ट तापमान या `0.7` जैसे गैर-शून्य मान का उपयोग करें।
- OpenAI ChatGPT/Codex OAuth (`openai-chatgpt-responses` API) की स्थानीय जाँच एक न्यूनतम सिस्टम निर्देश जोड़ती है, ताकि ट्रांसपोर्ट अपने आवश्यक `instructions` फ़ील्ड को भर सके — पूर्ण एजेंट संदर्भ, टूल, मेमोरी या सत्र ट्रांसक्रिप्ट नहीं।
- `model run --file` इमेज सामग्री को सीधे एकल उपयोगकर्ता संदेश से संलग्न करता है। MIME प्रकार के `image/*` के रूप में पहचाने जाने पर सामान्य प्रारूप (PNG, JPEG, WebP) काम करते हैं; असमर्थित या अपरिचित फ़ाइलें प्रदाता को कॉल किए जाने से पहले विफल हो जाती हैं। जब आप सीधे मल्टीमोडल-मॉडल जाँच के बजाय OpenClaw की इमेज-मॉडल रूटिंग और फ़ॉलबैक चाहते हों, तो `infer image describe` का उपयोग करें।
- चयनित मॉडल को इमेज इनपुट का समर्थन करना चाहिए; केवल-टेक्स्ट मॉडल प्रदाता स्तर पर अनुरोध अस्वीकार कर सकते हैं।
- `model run --prompt` में गैर-रिक्त-स्थान टेक्स्ट होना चाहिए; रिक्त प्रॉम्प्ट किसी भी प्रदाता या Gateway कॉल से पहले अस्वीकार कर दिए जाते हैं।
- जब प्रदाता कोई टेक्स्ट आउटपुट नहीं लौटाता, तब स्थानीय `model run` गैर-शून्य स्थिति के साथ बाहर निकलता है, ताकि पहुँच से बाहर प्रदाता और रिक्त कम्प्लीशन सफल जाँच जैसे न दिखें।
- मॉडल इनपुट को अपरिष्कृत रखते हुए Gateway रूटिंग या एजेंट-रनटाइम सेटअप का परीक्षण करने के लिए `model run --gateway` का उपयोग करें। पूर्ण एजेंट संदर्भ, टूल, मेमोरी और सत्र ट्रांसक्रिप्ट के लिए `openclaw agent` या किसी चैट सतह का उपयोग करें।
- `--thinking adaptive` कम्प्लीशन-रनटाइम स्तर के `medium` से मैप होता है; नेटिव अधिकतम प्रयास का समर्थन करने वाले OpenAI मॉडलों के लिए `--thinking max`, `max` से मैप होता है, अन्यथा `xhigh` से।
- `model auth login`, `model auth logout` और `model auth status` सहेजी गई प्रदाता प्रमाणीकरण स्थिति को प्रबंधित करते हैं।

## इमेज

जनरेशन, संपादन और विवरण।

```bash
openclaw infer image generate --prompt "मित्रवत लॉब्स्टर का चित्रण" --json
openclaw infer image generate --prompt "हेडफ़ोन की सिनेमाई उत्पाद फ़ोटो" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "पारदर्शी पृष्ठभूमि पर साधारण लाल गोलाकार स्टिकर" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "कम लागत वाला प्रारूप पोस्टर" --json
openclaw infer image generate --prompt "धीमा इमेज बैकएंड" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "लोगो को बनाए रखें, पृष्ठभूमि हटाएँ" --json
openclaw infer image edit --file ./poster.png --prompt "इसे एक लंबवत स्टोरी विज्ञापन बनाएँ" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "व्यापारी, तारीख और कुल राशि निकालें" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "स्क्रीनशॉट की तुलना करें और दिखाई देने वाले UI परिवर्तनों की सूची बनाएँ" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "इमेज का एक वाक्य में वर्णन करें" --timeout-ms 300000 --json
```

टिप्पणियाँ:

- मौजूदा इनपुट फ़ाइलों से शुरू करते समय `image edit` का उपयोग करें; `--size`, `--aspect-ratio`, या `--resolution` उनका समर्थन करने वाले प्रदाताओं/मॉडलों पर ज्यामिति संकेत जोड़ते हैं।
- `--output-format png --background transparent` को `--model openai/gpt-image-1.5` के साथ उपयोग करने पर पारदर्शी पृष्ठभूमि वाला OpenAI PNG आउटपुट मिलता है; `--openai-background` उसी संकेत का OpenAI-विशिष्ट उपनाम है। जो प्रदाता पृष्ठभूमि समर्थन घोषित नहीं करते, वे इसे अनदेखे ओवरराइड के रूप में रिपोर्ट करते हैं ([JSON आवरण](#json-output) में `ignoredOverrides` देखें)।
- `--quality low|medium|high|auto` उन प्रदाताओं के लिए काम करता है जो छवि-गुणवत्ता संकेतों का समर्थन करते हैं, जिनमें OpenAI शामिल है। OpenAI `--openai-moderation low|auto` भी स्वीकार करता है।
- `image providers --json` सूचीबद्ध करता है कि कौन-से बंडल किए गए छवि प्रदाता खोजे जा सकते हैं, कॉन्फ़िगर किए गए हैं और चुने गए हैं, तथा प्रत्येक कौन-सी जनरेशन/संपादन क्षमताएँ उपलब्ध कराता है।
- `image generate --model <provider/model> --json` छवि-जनरेशन परिवर्तनों के लिए सबसे सीमित लाइव स्मोक परीक्षण है:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image \
    --prompt "न्यूनतम समतल परीक्षण छवि: सफ़ेद पृष्ठभूमि पर एक नीला वर्ग, कोई पाठ नहीं।" \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  प्रतिक्रिया `ok`, `provider`, `model`, `attempts`, और लिखे गए आउटपुट पथों की रिपोर्ट करती है। जब `--output` सेट हो, तो अंतिम एक्सटेंशन प्रदाता द्वारा लौटाए गए MIME प्रकार के अनुरूप हो सकता है।

- `image describe` और `image describe-many` के लिए, कार्य-विशिष्ट निर्देश (OCR, तुलना, UI निरीक्षण, संक्षिप्त कैप्शन लेखन) हेतु `--prompt` का उपयोग करें।
- धीमे स्थानीय विज़न मॉडलों या Ollama के कोल्ड स्टार्ट के लिए `--timeout-ms` का उपयोग करें।
- `image describe` के लिए, स्पष्ट `--model` (यह छवि-सक्षम `<provider/model>` होना चाहिए) पहले चलता है, फिर वह कॉल विफल होने पर कॉन्फ़िगर किए गए `agents.defaults.imageModel.fallbacks` को आज़माता है। इनपुट-तैयारी त्रुटियाँ (फ़ाइल अनुपस्थित होना, असमर्थित URL) किसी भी फ़ॉलबैक प्रयास से पहले विफल हो जाती हैं, और मॉडल कैटलॉग या प्रदाता कॉन्फ़िगरेशन में मॉडल का छवि-सक्षम होना आवश्यक है।
- स्थानीय Ollama विज़न मॉडलों के लिए, पहले मॉडल पुल करें और `OLLAMA_API_KEY` को कोई भी प्लेसहोल्डर मान दें, उदाहरण के लिए `ollama-local`। [Ollama](/hi/providers/ollama#vision-and-image-description) देखें।

## ऑडियो

फ़ाइल ट्रांसक्रिप्शन (रीयलटाइम सत्र प्रबंधन नहीं)।

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "नामों और कार्रवाई मदों पर ध्यान दें" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` का `<provider/model>` होना आवश्यक है।

## TTS

वाक् संश्लेषण और TTS प्रदाता/पर्सोना स्थिति।

```bash
openclaw infer tts convert --text "openclaw की ओर से नमस्ते" --output ./hello.mp3 --json
openclaw infer tts convert --text "आपका बिल्ड पूरा हो गया है" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

टिप्पणियाँ:

- `tts status` केवल `--gateway` का समर्थन करता है (यह Gateway द्वारा प्रबंधित TTS स्थिति दर्शाता है)।
- TTS व्यवहार का निरीक्षण और कॉन्फ़िगरेशन करने के लिए `tts providers`, `tts voices`, `tts personas`, `tts set-provider`, और `tts set-persona` का उपयोग करें।

## वीडियो

जनरेशन और विवरण।

```bash
openclaw infer video generate --prompt "समुद्र के ऊपर सिनेमाई सूर्यास्त" --json
openclaw infer video generate --prompt "जंगल की झील के ऊपर धीमा ड्रोन शॉट" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

टिप्पणियाँ:

- `video generate` `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, और `--timeout-ms` स्वीकार करता है, जिन्हें वीडियो-जनरेशन रनटाइम को अग्रेषित किया जाता है।
- `video describe` के लिए `--model` का `<provider/model>` होना आवश्यक है।

## वेब

खोज और फ़ेच।

```bash
openclaw infer web search --query "OpenClaw दस्तावेज़" --json
openclaw infer web search --query "OpenClaw infer वेब प्रदाता" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` खोज और फ़ेच के लिए उपलब्ध, कॉन्फ़िगर किए गए और चुने गए प्रदाताओं को सूचीबद्ध करता है।

## एम्बेडिंग

वेक्टर निर्माण और एम्बेडिंग-प्रदाता निरीक्षण।

```bash
openclaw infer embedding create --text "मित्रवत लॉब्स्टर" --json
openclaw infer embedding create --text "ग्राहक सहायता टिकट: विलंबित शिपमेंट" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON आउटपुट

Infer कमांड साझा आवरण के अंतर्गत JSON आउटपुट को सामान्यीकृत करते हैं:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

स्थिर शीर्ष-स्तरीय फ़ील्ड:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (अनुरोध के साथ भेजे गए छवि संलग्नक, जहाँ लागू हो)
- `outputs`
- `ignoredOverrides` (वे संकेत कुंजियाँ जिनका प्रदाता समर्थन नहीं करता, जहाँ लागू हो)
- `error`

जनरेट किए गए मीडिया कमांडों के लिए, `outputs` में OpenClaw द्वारा लिखी गई फ़ाइलें होती हैं। स्वचालन के लिए मानव-पठनीय stdout को पार्स करने के बजाय उस ऐरे में मौजूद `path`, `mimeType`, `size`, और किसी भी मीडिया-विशिष्ट आयाम का उपयोग करें।

## सामान्य समस्याएँ

```bash
# गलत
openclaw infer media image generate --prompt "मित्रवत लॉब्स्टर"

# सही
openclaw infer image generate --prompt "मित्रवत लॉब्स्टर"
```

```bash
# गलत
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# सही
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [मॉडल](/hi/concepts/models)
