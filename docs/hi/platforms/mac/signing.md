---
read_when:
    - mac debug builds बनाना या साइन करना
summary: पैकेजिंग स्क्रिप्ट द्वारा जनरेट किए गए macOS डिबग बिल्ड के लिए साइनिंग चरण
title: macOS साइनिंग
x-i18n:
    generated_at: "2026-06-28T23:29:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac साइनिंग (debug builds)

यह ऐप आमतौर पर [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) से बनाया जाता है, जो अब:

- एक स्थिर debug bundle identifier सेट करता है: `ai.openclaw.mac.debug`
- उस bundle id के साथ Info.plist लिखता है (`BUNDLE_ID=...` के ज़रिए ओवरराइड करें)
- मुख्य binary और app bundle को साइन करने के लिए [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) को कॉल करता है, ताकि macOS हर rebuild को वही signed bundle माने और TCC permissions बनाए रखे (notifications, accessibility, screen recording, mic, speech)। स्थिर permissions के लिए, वास्तविक signing identity का उपयोग करें; ad-hoc opt-in है और नाज़ुक है ([macOS permissions](/hi/platforms/mac/permissions) देखें)।
- डिफ़ॉल्ट रूप से `CODESIGN_TIMESTAMP=auto` का उपयोग करता है; यह Developer ID signatures के लिए trusted timestamps सक्षम करता है। timestamping छोड़ने के लिए `CODESIGN_TIMESTAMP=off` सेट करें (offline debug builds)।
- build metadata को Info.plist में inject करता है: `OpenClawBuildTimestamp` (UTC) और `OpenClawGitCommit` (short hash), ताकि About pane build, git, और debug/release channel दिखा सके।
- **Packaging डिफ़ॉल्ट रूप से Node 24 पर है**: script TS builds और Control UI build चलाता है। Node 22 LTS, वर्तमान में `22.19+`, compatibility के लिए समर्थित रहता है।
- environment से `SIGN_IDENTITY` पढ़ता है। हमेशा अपने cert से sign करने के लिए अपने shell rc में `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (या आपका Developer ID Application cert) जोड़ें। Ad-hoc signing के लिए `ALLOW_ADHOC_SIGNING=1` या `SIGN_IDENTITY="-"` के ज़रिए स्पष्ट opt-in आवश्यक है (permission testing के लिए अनुशंसित नहीं)।
- signing के बाद Team ID audit चलाता है और यदि app bundle के अंदर कोई Mach-O अलग Team ID से signed है तो विफल हो जाता है। bypass करने के लिए `SKIP_TEAM_ID_CHECK=1` सेट करें।

## उपयोग

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Ad-hoc Signing नोट

`SIGN_IDENTITY="-"` (ad-hoc) से sign करते समय, script अपने-आप **Hardened Runtime** (`--options runtime`) को disabled कर देता है। यह crashes रोकने के लिए आवश्यक है जब app embedded frameworks (जैसे Sparkle) को load करने की कोशिश करता है जो वही Team ID साझा नहीं करते। Ad-hoc signatures TCC permission persistence भी तोड़ देते हैं; recovery steps के लिए [macOS permissions](/hi/platforms/mac/permissions) देखें।

## About के लिए build metadata

`package-mac-app.sh` bundle पर ये stamp करता है:

- `OpenClawBuildTimestamp`: package time पर ISO8601 UTC
- `OpenClawGitCommit`: short git hash (या unavailable होने पर `unknown`)

About tab version, build date, git commit, और यह कि यह debug build है या नहीं (`#if DEBUG` के ज़रिए), दिखाने के लिए इन keys को पढ़ता है। code changes के बाद इन values को refresh करने के लिए packager चलाएँ।

## क्यों

TCC permissions bundle identifier _और_ code signature से बंधे होते हैं। बदलते UUIDs वाले unsigned debug builds के कारण macOS हर rebuild के बाद grants भूल रहा था। binaries को sign करना (डिफ़ॉल्ट रूप से ad-hoc) और fixed bundle id/path (`dist/OpenClaw.app`) बनाए रखना builds के बीच grants को सुरक्षित रखता है, जो VibeTunnel approach से मेल खाता है।

## संबंधित

- [macOS app](/hi/platforms/macos)
- [macOS permissions](/hi/platforms/mac/permissions)
