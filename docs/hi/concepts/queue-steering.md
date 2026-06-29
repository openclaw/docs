---
read_when:
    - यह समझाना कि जब कोई एजेंट टूल्स का उपयोग कर रहा हो, तब steer कैसे व्यवहार करता है
    - सक्रिय-रन कतार व्यवहार या रनटाइम स्टीयरिंग इंटीग्रेशन बदलना
    - स्टीयरिंग की तुलना फ़ॉलोअप, कलेक्ट, और इंटरप्ट क्यू मोड से करना
summary: सक्रिय-रन स्टीयरिंग रनटाइम सीमाओं पर संदेशों को कैसे कतारबद्ध करती है
title: Steering कतार
x-i18n:
    generated_at: "2026-06-28T23:02:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

जब कोई सामान्य प्रॉम्प्ट तब आता है जब कोई सेशन रन पहले से स्ट्रीम हो रहा हो, तो OpenClaw
डिफ़ॉल्ट रूप से उस प्रॉम्प्ट को सक्रिय रनटाइम में भेजने की कोशिश करता है जब queue mode
`steer` हो। इस डिफ़ॉल्ट व्यवहार के लिए किसी config entry और किसी queue directive की
ज़रूरत नहीं होती। OpenClaw और native Codex app-server harness डिलीवरी
विवरण अलग-अलग तरीके से लागू करते हैं।

## रनटाइम सीमा

Steering पहले से चल रही tool call को बाधित नहीं करता। OpenClaw
model boundaries पर queued steering messages की जांच करता है:

1. assistant tool calls मांगता है।
2. OpenClaw मौजूदा assistant message के tool-call batch को निष्पादित करता है।
3. OpenClaw turn end event emit करता है।
4. OpenClaw queued steering messages को drain करता है।
5. OpenClaw अगले LLM call से पहले उन messages को user messages के रूप में append करता है।

यह tool results को उस assistant message के साथ जोड़े रखता है जिसने उन्हें अनुरोध किया था,
फिर अगली model call को नवीनतम user input देखने देता है।

native Codex app-server harness, OpenClaw runtime की internal steering queue के बजाय
`turn/steer` expose करता है। OpenClaw configured quiet window के लिए queued prompts को
batch करता है, फिर arrival order में collected सभी user input के साथ एक single
`turn/steer` request भेजता है।

Codex review और manual compaction turns same-turn steering को reject करते हैं। जब कोई
runtime `steer` mode में steering accept नहीं कर सकता, तो OpenClaw prompt शुरू करने से पहले
active run के finish होने का इंतज़ार करता है।

यह पेज normal inbound messages के लिए queue-mode steering समझाता है जब mode
`steer` हो। अगर mode `followup` या `collect` है, तो normal messages इस steering path में enter
नहीं करते; वे active run finish होने तक इंतज़ार करते हैं। explicit
`/steer <message>` command के लिए, [Steer](/hi/tools/steer) देखें।

## मोड

| मोड        | Active-run behavior                                    | बाद का behavior                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | संभव होने पर prompt को active runtime में steer करता है। | steering unavailable होने पर active run finish होने का इंतज़ार करता है।                      |
| `followup`  | steer नहीं करता।                                        | active run ends होने के बाद queued messages को बाद में run करता है।                               |
| `collect`   | steer नहीं करता।                                        | debounce window के बाद compatible queued messages को one later turn में coalesce करता है। |
| `interrupt` | active run को steer करने के बजाय abort करता है।          | abort करने के बाद newest message शुरू करता है।                                           |

## बर्स्ट उदाहरण

अगर agent के tool call execute करते समय चार users messages भेजते हैं:

- default behavior के साथ, active runtime को उसके अगले model decision से पहले
  arrival order में सभी चार messages मिलते हैं। OpenClaw उन्हें next model
  boundary पर drain करता है; Codex उन्हें one batched `turn/steer` के रूप में receive करता है।
- `/queue collect` के साथ, OpenClaw steer नहीं करता। यह active run
  ends होने तक इंतज़ार करता है, फिर debounce window के बाद compatible queued messages के साथ
  followup turn बनाता है।
- `/queue interrupt` के साथ, OpenClaw active run को abort करता है और steering के बजाय
  newest message शुरू करता है।

## दायरा

Steering हमेशा current active session run को target करता है। यह कोई नया
session नहीं बनाता, active run की tool policy नहीं बदलता, और messages को sender के आधार पर split नहीं करता। 
multi-user channels में, inbound prompts में पहले से sender और route context शामिल होता है, इसलिए
अगली model call देख सकती है कि हर message किसने भेजा।

जब आप चाहते हैं कि messages डिफ़ॉल्ट रूप से active run को steer करने के बजाय queue हों,
तो `followup` या `collect` use करें। जब newest prompt को active run
replace करना चाहिए, तो `interrupt` use करें।

## Debounce

`messages.queue.debounceMs` queued `followup` और `collect` delivery पर लागू होता है।
native Codex harness के साथ `steer` mode में, यह batched `turn/steer` भेजने से पहले quiet window भी set करता है।
OpenClaw के लिए, active steering खुद debounce timer use नहीं करता क्योंकि OpenClaw messages को naturally
next model boundary तक batch करता है।

## संबंधित

- [Command queue](/hi/concepts/queue)
- [Steer](/hi/tools/steer)
- [Messages](/hi/concepts/messages)
- [Agent loop](/hi/concepts/agent-loop)
