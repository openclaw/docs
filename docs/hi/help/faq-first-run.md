---
read_when:
    - नया इंस्टॉल, ऑनबोर्डिंग अटकी हुई, या पहली बार चलाने में त्रुटियां
    - प्रमाणीकरण और प्रदाता सदस्यताएँ चुनना
    - docs.openclaw.ai तक पहुँच नहीं हो रही, डैशबोर्ड नहीं खुल रहा, इंस्टॉल अटका हुआ है
sidebarTitle: First-run FAQ
summary: 'FAQ: त्वरित-आरंभ और पहली-बार सेटअप — इंस्टॉल, ऑनबोर्ड, auth, subscriptions, प्रारंभिक विफलताएँ'
title: 'अक्सर पूछे जाने वाले प्रश्न: पहली बार का सेटअप'
x-i18n:
    generated_at: "2026-06-28T23:16:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  त्वरित शुरुआत और पहली बार चलाने से जुड़े प्रश्नोत्तर। रोज़मर्रा के संचालन, मॉडल, प्रमाणीकरण, सत्र,
  और समस्या निवारण के लिए मुख्य [FAQ](/hi/help/faq) देखें।

  ## त्वरित शुरुआत और पहली बार सेटअप

  <AccordionGroup>
  <Accordion title="मैं अटका हुआ हूं, जल्दी से आगे बढ़ने का सबसे तेज़ तरीका">
    ऐसा स्थानीय AI एजेंट उपयोग करें जो **आपकी मशीन देख सके**। यह Discord में पूछने की तुलना में कहीं अधिक प्रभावी है,
    क्योंकि अधिकतर "मैं अटका हुआ हूं" मामले **स्थानीय कॉन्फ़िग या वातावरण की समस्याएं** होते हैं जिन्हें
    दूरस्थ सहायक जांच नहीं सकते।

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    ये टूल रेपो पढ़ सकते हैं, कमांड चला सकते हैं, लॉग जांच सकते हैं, और आपकी मशीन-स्तर की
    सेटअप समस्याएं ठीक करने में मदद कर सकते हैं (PATH, सेवाएं, अनुमतियां, प्रमाणीकरण फ़ाइलें)। उन्हें
    हैक करने योग्य (git) इंस्टॉल के ज़रिए **पूरा स्रोत checkout** दें:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    यह OpenClaw को **git checkout से** इंस्टॉल करता है, ताकि एजेंट कोड + डॉक्स पढ़ सके और
    आपके द्वारा चलाए जा रहे सटीक संस्करण के बारे में तर्क कर सके। आप बाद में इंस्टॉलर को
    `--install-method git` के बिना दोबारा चलाकर कभी भी stable पर वापस जा सकते हैं।

    सुझाव: एजेंट से fix को **योजना बनाने और निगरानी करने** के लिए कहें (चरण-दर-चरण), फिर केवल
    ज़रूरी कमांड चलाएं। इससे बदलाव छोटे और ऑडिट करने में आसान रहते हैं।

    अगर आपको कोई वास्तविक बग या fix मिलता है, तो कृपया GitHub issue दर्ज करें या PR भेजें:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    इन कमांड से शुरू करें (मदद मांगते समय आउटपुट साझा करें):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ये क्या करते हैं:

    - `openclaw status`: gateway/agent स्वास्थ्य + मूल कॉन्फ़िग का त्वरित snapshot।
    - `openclaw models status`: provider प्रमाणीकरण + मॉडल उपलब्धता जांचता है।
    - `openclaw doctor`: सामान्य कॉन्फ़िग/state समस्याओं को सत्यापित और ठीक करता है।

    अन्य उपयोगी CLI जांच: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    त्वरित debug loop: [अगर कुछ टूटा है तो पहले 60 सेकंड](/hi/help/faq#first-60-seconds-if-something-is-broken).
    इंस्टॉल डॉक्स: [Install](/hi/install), [Installer flags](/hi/install/installer), [Updating](/hi/install/updating).

  </Accordion>

  <Accordion title="Heartbeat बार-बार skip हो रहा है। skip कारणों का क्या मतलब है?">
    सामान्य heartbeat skip कारण:

    - `quiet-hours`: कॉन्फ़िगर की गई active-hours विंडो के बाहर
    - `empty-heartbeat-file`: `HEARTBEAT.md` मौजूद है, लेकिन उसमें केवल खाली, comment, header, fence, या empty-checklist scaffold है
    - `no-tasks-due`: `HEARTBEAT.md` task mode सक्रिय है, लेकिन किसी task interval का समय अभी नहीं आया है
    - `alerts-disabled`: सभी heartbeat visibility बंद है (`showOk`, `showAlerts`, और `useIndicator` सभी off हैं)

    task mode में, due timestamps केवल वास्तविक heartbeat run
    पूरा होने के बाद आगे बढ़ते हैं। skipped runs tasks को completed के रूप में mark नहीं करते।

    डॉक्स: [Heartbeat](/hi/gateway/heartbeat), [Automation](/hi/automation).

  </Accordion>

  <Accordion title="OpenClaw इंस्टॉल और सेटअप करने का सुझाया गया तरीका">
    रेपो source से चलाने और onboarding उपयोग करने की सिफारिश करता है:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    wizard UI assets भी अपने आप build कर सकता है। onboarding के बाद, आप आमतौर पर Gateway को port **18789** पर चलाते हैं।

    source से (contributors/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    अगर आपके पास अभी global install नहीं है, तो इसे `pnpm openclaw onboard` से चलाएं।

  </Accordion>

  <Accordion title="onboarding के बाद dashboard कैसे खोलूं?">
    wizard onboarding के तुरंत बाद आपके browser को साफ़ (non-tokenized) dashboard URL के साथ खोलता है और summary में link भी print करता है। उस tab को खुला रखें; अगर यह launch नहीं हुआ, तो उसी मशीन पर printed URL copy/paste करें।
  </Accordion>

  <Accordion title="localhost बनाम remote पर dashboard को authenticate कैसे करूं?">
    **Localhost (उसी मशीन पर):**

    - `http://127.0.0.1:18789/` खोलें।
    - अगर यह shared-secret auth मांगता है, तो configured token या password को Control UI settings में paste करें।
    - token source: `gateway.auth.token` (या `OPENCLAW_GATEWAY_TOKEN`)।
    - password source: `gateway.auth.password` (या `OPENCLAW_GATEWAY_PASSWORD`)।
    - अगर अभी कोई shared secret configured नहीं है, तो `openclaw doctor --generate-gateway-token` से token generate करें।

    **localhost पर नहीं:**

    - **Tailscale Serve** (recommended): bind loopback रखें, `openclaw gateway --tailscale serve` चलाएं, `https://<magicdns>/` खोलें। अगर `gateway.auth.allowTailscale` `true` है, तो identity headers Control UI/WebSocket auth पूरा कर देते हैं (pasted shared secret नहीं, trusted gateway host माना जाता है); HTTP APIs को अब भी shared-secret auth चाहिए, जब तक आप जानबूझकर private-ingress `none` या trusted-proxy HTTP auth उपयोग न करें।
      एक ही client से खराब concurrent Serve auth attempts को failed-auth limiter द्वारा record करने से पहले serialize किया जाता है, इसलिए दूसरा खराब retry पहले से ही `retry later` दिखा सकता है।
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` चलाएं (या password auth configure करें), `http://<tailscale-ip>:18789/` खोलें, फिर dashboard settings में matching shared secret paste करें।
    - **Identity-aware reverse proxy**: Gateway को trusted proxy के पीछे रखें, `gateway.auth.mode: "trusted-proxy"` configure करें, फिर proxy URL खोलें। same-host loopback proxies के लिए explicit `gateway.auth.trustedProxy.allowLoopback = true` चाहिए।
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` फिर `http://127.0.0.1:18789/` खोलें। tunnel पर भी shared-secret auth लागू रहता है; prompt होने पर configured token या password paste करें।

    bind modes और auth details के लिए [Dashboard](/hi/web/dashboard) और [Web surfaces](/hi/web) देखें।

  </Accordion>

  <Accordion title="chat approvals के लिए दो exec approval configs क्यों हैं?">
    वे अलग-अलग layers नियंत्रित करते हैं:

    - `approvals.exec`: approval prompts को chat destinations पर forward करता है
    - `channels.<channel>.execApprovals`: उस channel को exec approvals के लिए native approval client की तरह काम करने देता है

    host exec policy अभी भी वास्तविक approval gate है। chat config केवल यह नियंत्रित करता है कि approval
    prompts कहां दिखाई दें और लोग उनका उत्तर कैसे दे सकें।

    अधिकतर setups में आपको **दोनों** की ज़रूरत नहीं होती:

    - अगर chat पहले से commands और replies support करता है, तो same-chat `/approve` shared path से काम करता है।
    - अगर कोई supported native channel approvers को सुरक्षित रूप से infer कर सकता है, तो OpenClaw अब `channels.<channel>.execApprovals.enabled` unset या `"auto"` होने पर DM-first native approvals को auto-enable करता है।
    - जब native approval cards/buttons उपलब्ध हों, तो वही native UI primary path है; agent को manual `/approve` command केवल तभी शामिल करना चाहिए जब tool result कहे कि chat approvals unavailable हैं या manual approval ही एकमात्र path है।
    - `approvals.exec` केवल तब उपयोग करें जब prompts को अन्य chats या explicit ops rooms में भी forward करना हो।
    - `channels.<channel>.execApprovals.target: "channel"` या `"both"` केवल तब उपयोग करें जब आप approval prompts को originating room/topic में वापस post करना स्पष्ट रूप से चाहते हों।
    - Plugin approvals फिर अलग हैं: वे default रूप से same-chat `/approve`, optional `approvals.plugin` forwarding, और केवल कुछ native channels में ऊपर से plugin-approval-native handling उपयोग करते हैं।

    संक्षेप में: forwarding routing के लिए है, native client config अधिक समृद्ध channel-specific UX के लिए है।
    [Exec Approvals](/hi/tools/exec-approvals) देखें।

  </Accordion>

  <Accordion title="मुझे कौन सा runtime चाहिए?">
    Node **>= 22** आवश्यक है। `pnpm` recommended है। Gateway के लिए Bun **recommended नहीं** है।
  </Accordion>

  <Accordion title="क्या यह Raspberry Pi पर चलता है?">
    हां। Gateway lightweight है - डॉक्स व्यक्तिगत उपयोग के लिए **512MB-1GB RAM**, **1 core**, और लगभग **500MB**
    disk को पर्याप्त बताते हैं, और note करते हैं कि **Raspberry Pi 4 इसे चला सकता है**।

    अगर आप extra headroom चाहते हैं (logs, media, other services), तो **2GB recommended है**, लेकिन यह
    hard minimum नहीं है।

    सुझाव: एक छोटा Raspberry Pi/VPS Gateway host कर सकता है, और आप स्थानीय screen/camera/canvas या command execution के लिए
    अपने laptop/phone पर **nodes** pair कर सकते हैं। [Nodes](/hi/nodes) देखें।

  </Accordion>

  <Accordion title="Raspberry Pi installs के लिए कोई सुझाव?">
    संक्षेप में: यह काम करता है, लेकिन rough edges की अपेक्षा रखें।

    - **64-bit** OS उपयोग करें और Node >= 22 रखें।
    - **hackable (git) install** को प्राथमिकता दें ताकि आप logs देख सकें और तेज़ी से update कर सकें।
    - channels/skills के बिना शुरू करें, फिर उन्हें एक-एक करके जोड़ें।
    - अगर आपको अजीब binary issues मिलते हैं, तो यह आमतौर पर **ARM compatibility** समस्या होती है।

    डॉक्स: [Linux](/hi/platforms/linux), [Install](/hi/install).

  </Accordion>

  <Accordion title="यह wake up my friend पर अटका है / onboarding hatch नहीं हो रहा। अब क्या करें?">
    वह screen Gateway के reachable और authenticated होने पर निर्भर करती है। TUI भी first hatch पर
    "Wake up, my friend!" अपने आप भेजता है। अगर आपको वह line **बिना किसी reply** के दिखती है
    और tokens 0 पर रहते हैं, तो agent कभी चला ही नहीं।

    1. Gateway restart करें:

    ```bash
    openclaw gateway restart
    ```

    2. status + auth जांचें:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. अगर यह अभी भी hang करता है, तो चलाएं:

    ```bash
    openclaw doctor
    ```

    अगर Gateway remote है, तो सुनिश्चित करें कि tunnel/Tailscale connection up है और UI
    सही Gateway की ओर pointed है। [Remote access](/hi/gateway/remote) देखें।

  </Accordion>

  <Accordion title="क्या मैं onboarding दोबारा किए बिना अपना setup नई machine (Mac mini) पर migrate कर सकता हूं?">
    हां। **state directory** और **workspace** copy करें, फिर Doctor एक बार चलाएं। इससे
    आपका bot "बिल्कुल वैसा ही" रहता है (memory, session history, auth, और channel
    state), बशर्ते आप **दोनों** locations copy करें:

    1. नई machine पर OpenClaw install करें।
    2. पुरानी machine से `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) copy करें।
    3. अपना workspace (default: `~/.openclaw/workspace`) copy करें।
    4. `openclaw doctor` चलाएं और Gateway service restart करें।

    इससे config, auth profiles, WhatsApp creds, sessions, और memory सुरक्षित रहते हैं। अगर आप
    remote mode में हैं, तो याद रखें कि gateway host session store और workspace का owner होता है।

    **महत्वपूर्ण:** अगर आप केवल अपना workspace GitHub पर commit/push करते हैं, तो आप
    **memory + bootstrap files** का backup ले रहे हैं, लेकिन **session history या auth** का नहीं। वे
    `~/.openclaw/` के अंदर रहते हैं (उदाहरण के लिए `~/.openclaw/agents/<agentId>/sessions/`)।

    संबंधित: [Migrating](/hi/install/migrating), [Where things live on disk](/hi/help/faq#where-things-live-on-disk),
    [Agent workspace](/hi/concepts/agent-workspace), [Doctor](/hi/gateway/doctor),
    [Remote mode](/hi/gateway/remote).

  </Accordion>

  <Accordion title="latest version में नया क्या है, यह कहां देखूं?">
    GitHub changelog देखें:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    सबसे नई entries ऊपर होती हैं। अगर top section **Unreleased** mark है, तो अगला dated
    section latest shipped version है। entries **Highlights**, **Changes**, और
    **Fixes** (साथ में ज़रूरत होने पर docs/other sections) के हिसाब से grouped होती हैं।

  </Accordion>

  <Accordion title="docs.openclaw.ai access नहीं हो रहा (SSL error)">
    कुछ Comcast/Xfinity connections Xfinity
    Advanced Security के ज़रिए `docs.openclaw.ai` को गलत तरीके से block कर देते हैं। इसे disable करें या `docs.openclaw.ai` को allowlist करें, फिर retry करें।
    इसे unblock कराने में हमारी मदद के लिए यहां report करें: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    अगर आप फिर भी साइट तक नहीं पहुंच पा रहे हैं, तो docs GitHub पर mirror किए गए हैं:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable और beta के बीच अंतर">
    **Stable** और **beta** **npm dist-tags** हैं, अलग code lines नहीं:

    - `latest` = stable
    - `beta` = testing के लिए early build

    आम तौर पर, stable release पहले **beta** पर आता है, फिर एक स्पष्ट
    promotion step उसी version को `latest` पर ले जाता है। Maintainers जरूरत पड़ने पर
    सीधे `latest` पर भी publish कर सकते हैं। इसलिए promotion के बाद beta और stable
    **same version** की ओर point कर सकते हैं।

    देखें क्या बदला:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    install one-liners और beta तथा dev के बीच अंतर के लिए, नीचे वाला accordion देखें।

  </Accordion>

  <Accordion title="मैं beta version कैसे install करूं और beta तथा dev में क्या अंतर है?">
    **Beta** npm dist-tag `beta` है (promotion के बाद `latest` से match कर सकता है)।
    **Dev** `main` (git) का moving head है; publish होने पर, यह npm dist-tag `dev` का उपयोग करता है।

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    अधिक विवरण: [Development channels](/hi/install/development-channels) और [Installer flags](/hi/install/installer)।

  </Accordion>

  <Accordion title="मैं latest bits कैसे आजमाऊं?">
    दो विकल्प:

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    यह `main` branch पर switch करता है और source से update करता है।

    2. **Hackable install (installer site से):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    इससे आपको एक local repo मिलता है जिसे आप edit कर सकते हैं, फिर git के जरिए update कर सकते हैं।

    अगर आप manually clean clone पसंद करते हैं, तो उपयोग करें:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Update](/hi/cli/update), [Development channels](/hi/install/development-channels),
    [Install](/hi/install).

  </Accordion>

  <Accordion title="install और onboarding में आम तौर पर कितना समय लगता है?">
    Rough guide:

    - **Install:** 2-5 मिनट
    - **QuickStart onboarding:** आम तौर पर कुछ मिनट
    - **Full onboarding:** जब provider sign-in, channel pairing, daemon install,
      network downloads, skills, या optional plugins को extra setup चाहिए हो, तो अधिक समय लगता है

    CLI wizard यह timeline शुरू में दिखाता है। आप optional steps skip कर सकते हैं और
    बाद में `openclaw configure` के साथ वापस आ सकते हैं।

    अगर यह hang हो जाए, तो [Installer stuck](#quick-start-and-first-run-setup)
    और [I am stuck](#quick-start-and-first-run-setup) में fast debug loop का उपयोग करें।

  </Accordion>

  <Accordion title="Installer stuck? मुझे और feedback कैसे मिले?">
    installer को **verbose output** के साथ फिर से run करें:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose के साथ beta install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    hackable (git) install के लिए:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) equivalent:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    अधिक विकल्प: [Installer flags](/hi/install/installer).

  </Accordion>

  <Accordion title="Windows install कहता है git not found या openclaw not recognized">
    Windows की दो common समस्याएं:

    **1) npm error spawn git / git not found**

    - **Git for Windows** install करें और सुनिश्चित करें कि `git` आपके PATH पर है।
    - PowerShell बंद करके फिर खोलें, फिर installer दोबारा run करें।

    **2) install के बाद openclaw recognized नहीं है**

    - आपका npm global bin folder PATH पर नहीं है।
    - path जांचें:

      ```powershell
      npm config get prefix
      ```

    - उस directory को अपने user PATH में जोड़ें (Windows पर `\bin` suffix की जरूरत नहीं; अधिकतर systems पर यह `%AppData%\npm` होता है)।
    - PATH update करने के बाद PowerShell बंद करके फिर खोलें।

    desktop setup के लिए, native **Windows Hub** app का उपयोग करें। terminal-only
    setup के लिए, PowerShell installer और WSL2 Gateway paths दोनों supported हैं।
    Docs: [Windows](/hi/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec output garbled Chinese text दिखाता है - मुझे क्या करना चाहिए?">
    यह आम तौर पर native Windows shells पर console code page mismatch होता है।

    Symptoms:

    - `system.run`/`exec` output Chinese को mojibake के रूप में render करता है
    - वही command किसी दूसरे terminal profile में ठीक दिखता है

    PowerShell में quick workaround:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    फिर Gateway restart करें और अपना command फिर से आजमाएं:

    ```powershell
    openclaw gateway restart
    ```

    अगर आप latest OpenClaw पर भी इसे reproduce कर पा रहे हैं, तो इसे यहां track/report करें:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="docs ने मेरे question का जवाब नहीं दिया - मुझे बेहतर answer कैसे मिले?">
    **hackable (git) install** का उपयोग करें ताकि पूरा source और docs आपके पास locally हों, फिर
    अपने bot (या Claude/Codex) से _उस folder से_ पूछें ताकि वह repo पढ़ सके और सटीक जवाब दे सके।

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    अधिक विवरण: [Install](/hi/install) और [Installer flags](/hi/install/installer).

  </Accordion>

  <Accordion title="मैं Linux पर OpenClaw कैसे install करूं?">
    छोटा जवाब: Linux guide follow करें, फिर onboarding run करें।

    - Linux quick path + service install: [Linux](/hi/platforms/linux).
    - पूरा walkthrough: [Getting Started](/hi/start/getting-started).
    - Installer + updates: [Install & updates](/hi/install/updating).

  </Accordion>

  <Accordion title="मैं VPS पर OpenClaw कैसे install करूं?">
    कोई भी Linux VPS काम करता है। server पर install करें, फिर Gateway तक पहुंचने के लिए SSH/Tailscale का उपयोग करें।

    Guides: [exe.dev](/hi/install/exe-dev), [Hetzner](/hi/install/hetzner), [Fly.io](/hi/install/fly).
    Remote access: [Gateway remote](/hi/gateway/remote).

  </Accordion>

  <Accordion title="cloud/VPS install guides कहां हैं?">
    हम common providers के साथ एक **hosting hub** रखते हैं। कोई एक चुनें और guide follow करें:

    - [VPS hosting](/hi/vps) (सभी providers एक जगह)
    - [Fly.io](/hi/install/fly)
    - [Hetzner](/hi/install/hetzner)
    - [exe.dev](/hi/install/exe-dev)

    cloud में यह ऐसे काम करता है: **Gateway server पर चलता है**, और आप इसे
    अपने laptop/phone से Control UI (या Tailscale/SSH) के जरिए access करते हैं। आपका state + workspace
    server पर रहता है, इसलिए host को source of truth मानें और उसका backup रखें।

    आप उस cloud Gateway से **nodes** (Mac/iOS/Android/headless) pair कर सकते हैं ताकि
    local screen/camera/canvas access हो सके या Gateway को cloud में रखते हुए
    अपने laptop पर commands run किए जा सकें।

    Hub: [Platforms](/hi/platforms). Remote access: [Gateway remote](/hi/gateway/remote).
    Nodes: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes).

  </Accordion>

  <Accordion title="क्या मैं OpenClaw से खुद को update करने के लिए कह सकता हूं?">
    छोटा जवाब: **संभव है, अनुशंसित नहीं**। update flow
    Gateway को restart कर सकता है (जिससे active session drop हो जाता है), clean git checkout की जरूरत पड़ सकती है, और
    confirmation prompt कर सकता है। ज्यादा सुरक्षित: operator के रूप में shell से updates run करें।

    CLI का उपयोग करें:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    अगर आपको agent से automate करना ही है:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/hi/cli/update), [Updating](/hi/install/updating).

  </Accordion>

  <Accordion title="onboarding असल में क्या करता है?">
    `openclaw onboard` recommended setup path है। **local mode** में यह आपको इनके through ले जाता है:

    - **Model/auth setup** (provider OAuth, API keys, Anthropic setup-token, साथ ही LM Studio जैसे local model options)
    - **Workspace** location + bootstrap files
    - **Gateway settings** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, साथ ही QQ Bot जैसे bundled channel plugins)
    - **Daemon install** (macOS पर LaunchAgent; Linux/WSL2 पर systemd user unit)
    - **Health checks** और **skills** selection

    यह main prompts शुरू होने से पहले duration expectations भी set करता है और चेतावनी देता है अगर आपका
    configured model unknown है या auth missing है।

  </Accordion>

  <Accordion title="क्या इसे चलाने के लिए मुझे Claude या OpenAI subscription चाहिए?">
    नहीं। आप OpenClaw को **API keys** (Anthropic/OpenAI/others) के साथ या
    **local-only models** के साथ चला सकते हैं ताकि आपका data आपके device पर रहे। Subscriptions (Claude
    Pro/Max या OpenAI Codex) उन providers को authenticate करने के optional तरीके हैं।

    OpenClaw में Anthropic के लिए practical split है:

    - **Anthropic API key**: normal Anthropic API billing
    - **Claude CLI / OpenClaw में Claude subscription auth**: Anthropic staff ने
      हमें बताया कि यह usage फिर से allowed है, और OpenClaw इस integration के लिए `claude -p`
      usage को sanctioned मान रहा है, जब तक Anthropic कोई नई
      policy publish नहीं करता

    long-lived gateway hosts के लिए, Anthropic API keys अभी भी अधिक
    predictable setup हैं। OpenAI Codex OAuth OpenClaw जैसे external
    tools के लिए explicitly supported है।

    OpenClaw अन्य hosted subscription-style options भी support करता है, जिनमें
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, और
    **Z.AI / GLM Coding Plan** शामिल हैं।

    Docs: [Anthropic](/hi/providers/anthropic), [OpenAI](/hi/providers/openai),
    [Qwen Cloud](/hi/providers/qwen),
    [MiniMax](/hi/providers/minimax), [Z.AI (GLM)](/hi/providers/zai),
    [Local models](/hi/gateway/local-models), [Models](/hi/concepts/models).

  </Accordion>

  <Accordion title="क्या मैं API key के बिना Claude Max subscription उपयोग कर सकता हूं?">
    हां।

    Anthropic staff ने हमें बताया कि OpenClaw-style Claude CLI usage फिर से allowed है, इसलिए
    OpenClaw इस integration के लिए Claude subscription auth और `claude -p` usage को sanctioned
    मानता है, जब तक Anthropic कोई नई policy publish नहीं करता। अगर आप
    सबसे predictable server-side setup चाहते हैं, तो इसके बजाय Anthropic API key का उपयोग करें।

  </Accordion>

  <Accordion title="क्या आप Claude subscription auth (Claude Pro या Max) support करते हैं?">
    हां।

    Anthropic staff ने हमें बताया कि यह usage फिर से allowed है, इसलिए OpenClaw
    इस integration के लिए Claude CLI reuse और `claude -p` usage को sanctioned मानता है
    जब तक Anthropic कोई नई policy publish नहीं करता।

    Anthropic setup-token अभी भी supported OpenClaw token path के रूप में available है, लेकिन OpenClaw अब उपलब्ध होने पर Claude CLI reuse और `claude -p` को prefer करता है।
    production या multi-user workloads के लिए, Anthropic API key auth अभी भी
    अधिक सुरक्षित और predictable choice है। अगर आप OpenClaw में दूसरे subscription-style hosted
    options चाहते हैं, तो [OpenAI](/hi/providers/openai), [Qwen / Model
    Cloud](/hi/providers/qwen), [MiniMax](/hi/providers/minimax), और [GLM
    Models](/hi/providers/zai) देखें।

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="मुझे Anthropic से HTTP 429 rate_limit_error क्यों दिख रहा है?">
    इसका मतलब है कि मौजूदा विंडो के लिए आपका **Anthropic quota/rate limit** समाप्त हो गया है। यदि आप
    **Claude CLI** का उपयोग करते हैं, तो विंडो रीसेट होने की प्रतीक्षा करें या अपना प्लान अपग्रेड करें। यदि आप
    **Anthropic API key** का उपयोग करते हैं, तो उपयोग/बिलिंग के लिए Anthropic Console
    देखें और जरूरत के अनुसार सीमाएं बढ़ाएं।

    यदि संदेश खास तौर पर यह है:
    `Extra usage is required for long context requests`, तो अनुरोध
    Anthropic की 1M context window (GA-सक्षम 1M Claude 4.x मॉडल या legacy
    `context1m: true` config) का उपयोग करने की कोशिश कर रहा है। यह केवल तब काम करता है जब आपका credential
    long-context billing के लिए पात्र हो (API key billing या Extra Usage सक्षम वाला OpenClaw Claude-login path)।

    सुझाव: एक **fallback model** सेट करें ताकि प्रदाता rate-limited होने पर OpenClaw जवाब देना जारी रख सके।
    देखें [Models](/hi/cli/models), [OAuth](/hi/concepts/oauth), और
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/hi/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="क्या AWS Bedrock समर्थित है?">
    हां। OpenClaw में एक bundled **Amazon Bedrock (Converse)** प्रदाता है। AWS env markers मौजूद होने पर, OpenClaw streaming/text Bedrock catalog को auto-discover कर सकता है और उसे implicit `amazon-bedrock` प्रदाता के रूप में merge कर सकता है; अन्यथा आप `plugins.entries.amazon-bedrock.config.discovery.enabled` को स्पष्ट रूप से सक्षम कर सकते हैं या manual provider entry जोड़ सकते हैं। देखें [Amazon Bedrock](/hi/providers/bedrock) और [Model providers](/hi/providers/models)। यदि आप managed key flow पसंद करते हैं, तो Bedrock के आगे OpenAI-compatible proxy अब भी एक मान्य विकल्प है।
  </Accordion>

  <Accordion title="Codex auth कैसे काम करता है?">
    OpenClaw OAuth (ChatGPT sign-in) के जरिए **OpenAI Code (Codex)** का समर्थन करता है। सामान्य setup के लिए
    `openai/gpt-5.5` का उपयोग करें: ChatGPT/Codex subscription auth plus
    native Codex app-server execution। Legacy Codex GPT refs ऐसे
    legacy config हैं जिन्हें `openclaw doctor --fix` ठीक करता है। Direct OpenAI API-key
    access non-agent OpenAI API surfaces के लिए और ordered `openai` API-key profile के जरिए agent
    models के लिए उपलब्ध रहता है।
    देखें [Model providers](/hi/concepts/model-providers) और [Onboarding (CLI)](/hi/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw अब भी legacy OpenAI Codex prefix का उल्लेख क्यों करता है?">
    `openai` OpenAI API keys और ChatGPT/Codex OAuth, दोनों के लिए provider और auth-profile id है।
    आपको legacy config और migration warnings में अब भी legacy OpenAI Codex prefix दिख सकता है।
    पुराने configs इसे model prefix के रूप में भी उपयोग करते थे:

    - `openai/gpt-5.5` = agent turns के लिए native Codex runtime के साथ ChatGPT/Codex subscription auth
    - legacy Codex GPT-5.5 ref = legacy model route जिसे `openclaw doctor --fix` ठीक करता है
    - `openai/gpt-5.5` plus an ordered `openai` API-key profile = OpenAI agent model के लिए API-key auth
    - legacy Codex auth profile ids = legacy auth profile id जिसे `openclaw doctor --fix` migrate करता है

    यदि आप direct OpenAI Platform billing/limit path चाहते हैं, तो
    `OPENAI_API_KEY` सेट करें। यदि आप ChatGPT/Codex subscription auth चाहते हैं, तो
    `openclaw models auth login --provider openai` से sign in करें। model ref को
    `openai/gpt-5.5` ही रखें; legacy Codex model refs legacy config हैं जिन्हें
    `openclaw doctor --fix` rewrite करता है।

  </Accordion>

  <Accordion title="Codex OAuth limits ChatGPT web से अलग क्यों हो सकते हैं?">
    Codex OAuth OpenAI-managed, plan-dependent quota windows का उपयोग करता है। व्यवहार में,
    ये limits ChatGPT website/app अनुभव से अलग हो सकते हैं, भले ही
    दोनों एक ही account से जुड़े हों।

    OpenClaw `openclaw models status` में वर्तमान में दिखाई देने वाली provider usage/quota windows दिखा सकता है,
    लेकिन यह ChatGPT-web entitlements को direct API access में invent या normalize नहीं करता।
    यदि आप direct OpenAI Platform billing/limit path चाहते हैं, तो API key के साथ `openai/*` का उपयोग करें।

  </Accordion>

  <Accordion title="क्या आप OpenAI subscription auth (Codex OAuth) का समर्थन करते हैं?">
    हां। OpenClaw **OpenAI Code (Codex) subscription OAuth** का पूरी तरह समर्थन करता है।
    OpenAI स्पष्ट रूप से OpenClaw जैसे external tools/workflows में subscription OAuth usage की अनुमति देता है।
    Onboarding आपके लिए OAuth flow चला सकता है।

    देखें [OAuth](/hi/concepts/oauth), [Model providers](/hi/concepts/model-providers), और [Onboarding (CLI)](/hi/start/wizard).

  </Accordion>

  <Accordion title="मैं Gemini CLI OAuth कैसे सेट करूं?">
    Gemini CLI **plugin auth flow** का उपयोग करता है, `openclaw.json` में client id या secret का नहीं।

    चरण:

    1. Gemini CLI को locally install करें ताकि `gemini` `PATH` पर हो
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin सक्षम करें: `openclaw plugins enable google`
    3. Login करें: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Login के बाद default model: `google-gemini-cli/gemini-3-flash-preview`
    5. यदि requests fail हों, तो gateway host पर `GOOGLE_CLOUD_PROJECT` या `GOOGLE_CLOUD_PROJECT_ID` सेट करें

    यह OAuth tokens को gateway host पर auth profiles में store करता है। विवरण: [Model providers](/hi/concepts/model-providers).

  </Accordion>

  <Accordion title="क्या casual chats के लिए local model ठीक है?">
    आम तौर पर नहीं। OpenClaw को बड़े context + मजबूत safety की जरूरत होती है; छोटे cards truncate और leak करते हैं। यदि जरूरी हो, तो locally (LM Studio) वह **सबसे बड़ा** model build चलाएं जो आप चला सकते हैं और [/gateway/local-models](/hi/gateway/local-models) देखें। छोटे/quantized models prompt-injection risk बढ़ाते हैं - देखें [Security](/hi/gateway/security).
  </Accordion>

  <Accordion title="मैं hosted model traffic को किसी खास region में कैसे रखूं?">
    region-pinned endpoints चुनें। OpenRouter MiniMax, Kimi, और GLM के लिए US-hosted options exposes करता है; data को in-region रखने के लिए US-hosted variant चुनें। आप `models.mode: "merge"` का उपयोग करके इनके साथ Anthropic/OpenAI को अब भी list कर सकते हैं ताकि आपके चुने हुए regioned provider का सम्मान करते हुए fallbacks उपलब्ध रहें।
  </Accordion>

  <Accordion title="क्या इसे install करने के लिए मुझे Mac Mini खरीदना होगा?">
    नहीं। OpenClaw macOS या Linux पर चलता है (Windows via WSL2)। Mac mini optional है - कुछ लोग
    always-on host के रूप में एक खरीदते हैं, लेकिन छोटा VPS, home server, या Raspberry Pi-class box भी काम करता है।

    आपको Mac केवल **macOS-only tools** के लिए चाहिए। iMessage के लिए, Messages में signed in किसी भी Mac पर `imsg` के साथ [iMessage](/hi/channels/imessage) का उपयोग करें। यदि Gateway Linux या कहीं और चलता है, तो `channels.imessage.cliPath` को ऐसे SSH wrapper पर सेट करें जो उस Mac पर `imsg` चलाता हो। यदि आप अन्य macOS-only tools चाहते हैं, तो Gateway को Mac पर चलाएं या macOS node pair करें।

    Docs: [iMessage](/hi/channels/imessage), [Nodes](/hi/nodes), [Mac remote mode](/hi/platforms/mac/remote).

  </Accordion>

  <Accordion title="क्या iMessage support के लिए मुझे Mac mini चाहिए?">
    आपको Messages में signed in **कोई macOS device** चाहिए। यह Mac mini होना जरूरी **नहीं** है -
    कोई भी Mac काम करता है। `imsg` के साथ **[iMessage](/hi/channels/imessage) का उपयोग करें**; Gateway उस Mac पर चल सकता है, या SSH wrapper `cliPath` के साथ कहीं और चल सकता है।

    सामान्य setups:

    - Gateway को Linux/VPS पर चलाएं, और `channels.imessage.cliPath` को ऐसे SSH wrapper पर सेट करें जो Messages में signed in Mac पर `imsg` चलाता हो।
    - यदि आप सबसे सरल single-machine setup चाहते हैं, तो सब कुछ Mac पर चलाएं।

    Docs: [iMessage](/hi/channels/imessage), [Nodes](/hi/nodes),
    [Mac remote mode](/hi/platforms/mac/remote).

  </Accordion>

  <Accordion title="यदि मैं OpenClaw चलाने के लिए Mac mini खरीदूं, तो क्या उसे अपने MacBook Pro से connect कर सकता हूं?">
    हां। **Mac mini Gateway चला सकता है**, और आपका MacBook Pro
    **node** (companion device) के रूप में connect हो सकता है। Nodes Gateway नहीं चलाते - वे उस device पर screen/camera/canvas और `system.run` जैसी अतिरिक्त
    capabilities प्रदान करते हैं।

    सामान्य pattern:

    - Mac mini पर Gateway (always-on)।
    - MacBook Pro macOS app या node host चलाता है और Gateway से pair करता है।
    - इसे देखने के लिए `openclaw nodes status` / `openclaw nodes list` का उपयोग करें।

    Docs: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes).

  </Accordion>

  <Accordion title="क्या मैं Bun का उपयोग कर सकता हूं?">
    Bun **recommended नहीं है**। हमें runtime bugs दिखते हैं, खासकर WhatsApp और Telegram के साथ।
    स्थिर gateways के लिए **Node** का उपयोग करें।

    यदि आप फिर भी Bun के साथ प्रयोग करना चाहते हैं, तो इसे WhatsApp/Telegram के बिना non-production gateway पर करें।

  </Accordion>

  <Accordion title="Telegram: allowFrom में क्या जाता है?">
    `channels.telegram.allowFrom` **मानव sender का Telegram user ID** (numeric) है। यह bot username नहीं है।

    Setup केवल numeric user IDs मांगता है। यदि आपके config में पहले से legacy `@username` entries हैं, तो `openclaw doctor --fix` उन्हें resolve करने की कोशिश कर सकता है।

    अधिक सुरक्षित (कोई third-party bot नहीं):

    - अपने bot को DM करें, फिर `openclaw logs --follow` चलाएं और `from.id` पढ़ें।

    Official Bot API:

    - अपने bot को DM करें, फिर `https://api.telegram.org/bot<bot_token>/getUpdates` call करें और `message.from.id` पढ़ें।

    Third-party (कम private):

    - `@userinfobot` या `@getidsbot` को DM करें।

    देखें [/channels/telegram](/hi/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="क्या अलग-अलग OpenClaw instances के साथ कई लोग एक WhatsApp number उपयोग कर सकते हैं?">
    हां, **multi-agent routing** के जरिए। प्रत्येक sender की WhatsApp **DM** (peer `kind: "direct"`, sender E.164 जैसे `+15551234567`) को अलग `agentId` से bind करें, ताकि प्रत्येक व्यक्ति को अपना workspace और session store मिले। Replies अब भी **उसी WhatsApp account** से आते हैं, और DM access control (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) हर WhatsApp account के लिए global है। देखें [Multi-Agent Routing](/hi/concepts/multi-agent) और [WhatsApp](/hi/channels/whatsapp).
  </Accordion>

  <Accordion title='क्या मैं एक "fast chat" agent और एक "Opus for coding" agent चला सकता हूं?'>
    हां। multi-agent routing का उपयोग करें: प्रत्येक agent को अपना default model दें, फिर inbound routes (provider account या specific peers) को प्रत्येक agent से bind करें। Example config [Multi-Agent Routing](/hi/concepts/multi-agent) में है। यह भी देखें [Models](/hi/concepts/models) और [Configuration](/hi/gateway/configuration).
  </Accordion>

  <Accordion title="क्या Homebrew Linux पर काम करता है?">
    हां। Homebrew Linux (Linuxbrew) का समर्थन करता है। Quick setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    यदि आप OpenClaw को systemd के जरिए चलाते हैं, तो सुनिश्चित करें कि service PATH में `/home/linuxbrew/.linuxbrew/bin` (या आपका brew prefix) शामिल हो ताकि `brew`-installed tools non-login shells में resolve हों।
    Recent builds Linux systemd services पर common user bin dirs भी prepend करते हैं (उदाहरण के लिए `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) और set होने पर `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, और `FNM_DIR` का सम्मान करते हैं।

  </Accordion>

  <Accordion title="hackable git install और npm install के बीच अंतर">
    - **Hackable (git) install:** full source checkout, editable, contributors के लिए best।
      आप builds locally चलाते हैं और code/docs patch कर सकते हैं।
    - **npm install:** global CLI install, कोई repo नहीं, "just run it" के लिए best।
      Updates npm dist-tags से आते हैं।

    Docs: [Getting started](/hi/start/getting-started), [Updating](/hi/install/updating).

  </Accordion>

  <Accordion title="क्या मैं बाद में npm और git installs के बीच switch कर सकता हूं?">
    हां। जब OpenClaw पहले से installed हो, तो `openclaw update --channel ...` का उपयोग करें।
    यह **आपका data delete नहीं करता** - यह केवल OpenClaw code install बदलता है।
    आपका state (`~/.openclaw`) और workspace (`~/.openclaw/workspace`) untouched रहते हैं।

    npm से git:

    ```bash
    openclaw update --channel dev
    ```

    git से npm:

    ```bash
    openclaw update --channel stable
    ```

    पहले नियोजित मोड स्विच का पूर्वावलोकन करने के लिए `--dry-run` जोड़ें। updater
    Doctor follow-ups चलाता है, लक्ष्य channel के लिए plugin स्रोतों को रीफ़्रेश करता है, और
    जब तक आप `--no-restart` पास नहीं करते, gateway को restart करता है।

    installer किसी भी मोड को force भी कर सकता है:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Backup सुझाव: [Backup strategy](/hi/help/faq#where-things-live-on-disk) देखें।

  </Accordion>

  <Accordion title="मुझे Gateway अपने laptop पर चलाना चाहिए या VPS पर?">
    संक्षिप्त उत्तर: **अगर आप 24/7 विश्वसनीयता चाहते हैं, तो VPS इस्तेमाल करें**। अगर आप
    कम-से-कम झंझट चाहते हैं और sleep/restart से कोई दिक्कत नहीं है, तो इसे locally चलाएँ।

    **Laptop (local Gateway)**

    - **फायदे:** server लागत नहीं, local files तक direct access, live browser window।
    - **नुकसान:** sleep/network drops = disconnects, OS updates/reboots बाधा डालते हैं, awake रहना ज़रूरी है।

    **VPS / cloud**

    - **फायदे:** always-on, stable network, laptop sleep issues नहीं, चलाते रखना आसान।
    - **नुकसान:** अक्सर headless चलते हैं (screenshots इस्तेमाल करें), केवल remote file access, updates के लिए SSH करना होगा।

    **OpenClaw-विशिष्ट नोट:** WhatsApp/Telegram/Slack/Mattermost/Discord सभी VPS से ठीक काम करते हैं। असली trade-off सिर्फ **headless browser** बनाम visible window है। [Browser](/hi/tools/browser) देखें।

    **अनुशंसित default:** अगर आपको पहले gateway disconnects हुए हैं, तो VPS। जब आप Mac को actively इस्तेमाल कर रहे हों और local file access या visible browser के साथ UI automation चाहते हों, तो local बेहतरीन है।

  </Accordion>

  <Accordion title="OpenClaw को dedicated machine पर चलाना कितना महत्वपूर्ण है?">
    ज़रूरी नहीं, लेकिन **विश्वसनीयता और isolation के लिए अनुशंसित** है।

    - **Dedicated host (VPS/Mac mini/Raspberry Pi):** always-on, sleep/reboot interruptions कम, cleaner permissions, चलाते रखना आसान।
    - **Shared laptop/desktop:** testing और active use के लिए पूरी तरह ठीक है, लेकिन machine के sleep या updates के दौरान pauses की अपेक्षा करें।

    अगर आप दोनों का बेहतर संयोजन चाहते हैं, तो Gateway को dedicated host पर रखें और local screen/camera/exec tools के लिए अपने laptop को **node** के रूप में pair करें। [Nodes](/hi/nodes) देखें।
    security guidance के लिए, [Security](/hi/gateway/security) पढ़ें।

  </Accordion>

  <Accordion title="न्यूनतम VPS आवश्यकताएँ और अनुशंसित OS क्या हैं?">
    OpenClaw हल्का है। basic Gateway + एक chat channel के लिए:

    - **पूर्ण न्यूनतम:** 1 vCPU, 1GB RAM, ~500MB disk।
    - **अनुशंसित:** headroom (logs, media, multiple channels) के लिए 1-2 vCPU, 2GB RAM या अधिक। Node tools और browser automation संसाधन-भूखे हो सकते हैं।

    OS: **Ubuntu LTS** (या कोई भी modern Debian/Ubuntu) इस्तेमाल करें। Linux install path वहीं सबसे अच्छी तरह test किया गया है।

    Docs: [Linux](/hi/platforms/linux), [VPS hosting](/hi/vps)।

  </Accordion>

  <Accordion title="क्या मैं OpenClaw को VM में चला सकता हूँ और आवश्यकताएँ क्या हैं?">
    हाँ। VM को VPS जैसा ही मानें: उसे always on, reachable होना चाहिए, और Gateway तथा आपके enable किए गए channels के लिए पर्याप्त
    RAM होनी चाहिए।

    Baseline guidance:

    - **पूर्ण न्यूनतम:** 1 vCPU, 1GB RAM।
    - **अनुशंसित:** अगर आप multiple channels, browser automation, या media tools चलाते हैं, तो 2GB RAM या अधिक।
    - **OS:** Ubuntu LTS या कोई अन्य modern Debian/Ubuntu।

    अगर आप Windows पर हैं, तो desktop setup के लिए **Windows Hub** इस्तेमाल करें, या जब
    आपको विशेष रूप से broad tooling
    compatibility वाला Linux-style Gateway VM चाहिए, तब WSL2 इस्तेमाल करें। [Windows](/hi/platforms/windows), [VPS hosting](/hi/vps) देखें।
    अगर आप macOS को VM में चला रहे हैं, तो [macOS VM](/hi/install/macos-vm) देखें।

  </Accordion>
</AccordionGroup>

## संबंधित

- [FAQ](/hi/help/faq) — मुख्य FAQ (models, sessions, gateway, security, और अधिक)
- [Install overview](/hi/install)
- [Getting started](/hi/start/getting-started)
- [Troubleshooting](/hi/help/troubleshooting)
