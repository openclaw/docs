---
read_when:
    - आप zsh/bash/fish/PowerShell के लिए शेल कम्प्लीशन चाहते हैं
    - आपको completion scripts को OpenClaw की state में कैश करना होगा
summary: '`openclaw completion` के लिए CLI संदर्भ (शेल पूर्णता स्क्रिप्ट जनरेट/इंस्टॉल करें)'
title: पूर्णता
x-i18n:
    generated_at: "2026-07-16T13:52:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

शेल कम्प्लीशन स्क्रिप्ट जनरेट करें, उन्हें OpenClaw स्टेट के अंतर्गत कैश करें, और वैकल्पिक रूप से उन्हें अपनी शेल प्रोफ़ाइल में इंस्टॉल करें।

## उपयोग

```bash
openclaw completion                          # zsh स्क्रिप्ट को stdout पर प्रिंट करें
openclaw completion --shell fish             # fish स्क्रिप्ट प्रिंट करें
openclaw completion --write-state            # सभी शेल के लिए स्क्रिप्ट कैश करें
openclaw completion --write-state --install  # कैश करें, फिर एक चरण में इंस्टॉल करें
openclaw completion --shell bash --write-state
```

## विकल्प

- `-s, --shell <shell>`: लक्षित शेल (`zsh`, `bash`, `powershell`, `fish`; डिफ़ॉल्ट: `zsh`)
- `-i, --install`: कैश की गई स्क्रिप्ट के लिए अपनी शेल प्रोफ़ाइल में एक सोर्स लाइन जोड़कर कम्प्लीशन इंस्टॉल करें
- `--write-state`: stdout पर प्रिंट किए बिना कम्प्लीशन स्क्रिप्ट को `$OPENCLAW_STATE_DIR/completions` (डिफ़ॉल्ट `~/.openclaw/completions`) में लिखें; `--shell` के साथ केवल उस शेल को लिखता है, अन्यथा चारों को
- `-y, --yes`: इंस्टॉल की पुष्टि के प्रॉम्प्ट छोड़ें (गैर-इंटरैक्टिव)

## इंस्टॉल प्रवाह

`--install` आपकी प्रोफ़ाइल को कैश की गई स्क्रिप्ट की ओर इंगित करता है, इसलिए कैश पहले से मौजूद होना चाहिए: यदि वह उपलब्ध नहीं है, तो कमांड विफल हो जाता है और आपको `openclaw completion --write-state` चलाने के लिए कहता है। दोनों कार्य एक चरण में करने के लिए `--write-state --install` को साथ में उपयोग करें। `--shell` के बिना, `--install`, `$SHELL` से शेल का पता लगाता है (अन्यथा zsh का उपयोग करता है)।

इंस्टॉल आपकी शेल प्रोफ़ाइल में एक छोटा `# OpenClaw Completion` ब्लॉक लिखता है और किसी भी पुरानी धीमी `source <(openclaw completion ...)` लाइन को कैश की गई सोर्स लाइन से बदल देता है:

| शेल       | प्रोफ़ाइल                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (`~/.bashrc` उपलब्ध न होने पर `~/.bash_profile` का उपयोग करता है)                                                                                                                  |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (Windows पर: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, या Windows PowerShell के लिए `Documents/WindowsPowerShell/...`) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## नोट्स

- `--install` या `--write-state` के बिना, कमांड स्क्रिप्ट को stdout पर प्रिंट करता है।
- कम्प्लीशन जनरेशन, Plugin CLI कमांड सहित, पूरे कमांड ट्री को पहले ही लोड कर लेता है, इसलिए नेस्टेड सबकमांड भी शामिल होते हैं।
- `openclaw update` सफल अपडेट के बाद कम्प्लीशन कैश को स्वचालित रूप से रीफ़्रेश करता है; `openclaw doctor` अनुपलब्ध या पुराने कम्प्लीशन सेटअप की मरम्मत कर सकता है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
