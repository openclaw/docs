---
read_when:
    - आप सुरक्षा सुदृढ़ीकरण के साथ स्वचालित सर्वर परिनियोजन चाहते हैं
    - आपको VPN एक्सेस के साथ फ़ायरवॉल-पृथक सेटअप चाहिए
    - आप रिमोट Debian/Ubuntu सर्वरों पर डिप्लॉय कर रहे हैं
summary: Ansible, Tailscale VPN और फ़ायरवॉल आइसोलेशन के साथ स्वचालित, सुदृढ़ OpenClaw इंस्टॉलेशन
title: Ansible
x-i18n:
    generated_at: "2026-07-16T15:23:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw को उत्पादन सर्वरों पर **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** के साथ डिप्लॉय करें, जो सुरक्षा-प्रथम आर्किटेक्चर वाला एक स्वचालित इंस्टॉलर है।

<Info>
Ansible डिप्लॉयमेंट के लिए [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) रिपॉज़िटरी प्रामाणिक स्रोत है। यह पृष्ठ एक संक्षिप्त अवलोकन है।
</Info>

## पूर्वापेक्षाएँ

| आवश्यकता | विवरण                                                   |
| ----------- | --------------------------------------------------------- |
| OS          | Debian 11+ या Ubuntu 20.04+                               |
| पहुँच      | Root या sudo विशेषाधिकार                                   |
| नेटवर्क     | पैकेज इंस्टॉलेशन के लिए इंटरनेट कनेक्शन              |
| Ansible     | 2.14+ (क्विक-स्टार्ट स्क्रिप्ट द्वारा स्वचालित रूप से इंस्टॉल किया जाता है) |

## आपको क्या मिलता है

- फ़ायरवॉल-प्रथम सुरक्षा: UFW + Docker पृथक्करण (केवल SSH + Tailscale पहुँच योग्य)
- सेवाओं को सार्वजनिक रूप से उजागर किए बिना रिमोट पहुँच के लिए Tailscale VPN
- केवल लोकलहोस्ट बाइंडिंग वाले पृथक सैंडबॉक्स कंटेनरों के लिए Docker
- सुरक्षा सुदृढ़ीकरण सहित Systemd एकीकरण, जो बूट पर स्वतः शुरू होता है
- एक-कमांड सेटअप

## त्वरित शुरुआत

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## क्या इंस्टॉल होता है

1. Tailscale (सुरक्षित रिमोट पहुँच के लिए मेश VPN)
2. UFW फ़ायरवॉल (केवल SSH + Tailscale पोर्ट)
3. Docker CE + Compose V2 (डिफ़ॉल्ट एजेंट सैंडबॉक्स बैकएंड)
4. Node.js और pnpm (OpenClaw के लिए Node 22.22.3+, 24.15+, या 25.9+ आवश्यक है; Node 24 अनुशंसित है)
5. OpenClaw, होस्ट-आधारित रूप से इंस्टॉल किया गया, कंटेनरीकृत नहीं
6. सुरक्षा सुदृढ़ीकरण वाली एक systemd सेवा

<Note>
Gateway सीधे होस्ट पर चलता है, Docker में नहीं। एजेंट सैंडबॉक्सिंग
वैकल्पिक है; यह प्लेबुक Docker इंस्टॉल करती है क्योंकि यह डिफ़ॉल्ट सैंडबॉक्स
बैकएंड है। अन्य बैकएंड के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) देखें।
</Note>

## इंस्टॉलेशन के बाद का सेटअप

<Steps>
  <Step title="openclaw उपयोगकर्ता पर स्विच करें">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="ऑनबोर्डिंग विज़ार्ड चलाएँ">
    इंस्टॉलेशन के बाद की स्क्रिप्ट OpenClaw को कॉन्फ़िगर करने में आपका मार्गदर्शन करती है।
  </Step>
  <Step title="मैसेजिंग चैनल कनेक्ट करें">
    WhatsApp, Telegram, Discord, या Signal में लॉग इन करें:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="इंस्टॉलेशन सत्यापित करें">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscale से कनेक्ट करें">
    सुरक्षित रिमोट पहुँच के लिए अपने VPN मेश से जुड़ें।
  </Step>
</Steps>

### त्वरित कमांड

```bash
# सेवा की स्थिति जाँचें
sudo systemctl status openclaw

# लाइव लॉग देखें
sudo journalctl -u openclaw -f

# Gateway पुनः आरंभ करें
sudo systemctl restart openclaw

# चैनल लॉगिन (openclaw उपयोगकर्ता के रूप में चलाएँ)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## सुरक्षा आर्किटेक्चर

चार-स्तरीय रक्षा मॉडल:

1. फ़ायरवॉल (UFW): केवल SSH (22) और Tailscale (41641/udp) सार्वजनिक रूप से उजागर
2. VPN (Tailscale): Gateway केवल VPN मेश के माध्यम से पहुँच योग्य
3. Docker पृथक्करण: `DOCKER-USER` iptables चेन बाहरी पोर्ट एक्सपोज़र को रोकती है
4. Systemd सुदृढ़ीकरण: `NoNewPrivileges`, `PrivateTmp`, विशेषाधिकार-रहित उपयोगकर्ता

अपनी बाहरी आक्रमण सतह सत्यापित करें:

```bash
nmap -p- YOUR_SERVER_IP
```

केवल पोर्ट 22 (SSH) खुला होना चाहिए। Gateway और Docker सुरक्षित रूप से बंद रहते हैं।

Docker एजेंट सैंडबॉक्स (पृथक टूल निष्पादन) के लिए इंस्टॉल किया जाता है, Gateway चलाने के लिए नहीं। सैंडबॉक्स कॉन्फ़िगरेशन के लिए [मल्टी-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools) देखें।

## मैन्युअल इंस्टॉलेशन

<Steps>
  <Step title="पूर्वापेक्षाएँ इंस्टॉल करें">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="रिपॉज़िटरी क्लोन करें">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansible कलेक्शन इंस्टॉल करें">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="प्लेबुक चलाएँ">
    ```bash
    ./run-playbook.sh
    ```

    या प्लेबुक को सीधे चलाएँ और फिर सेटअप स्क्रिप्ट को मैन्युअल रूप से चलाएँ:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # फिर चलाएँ: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## अपडेट करना

Ansible इंस्टॉलर OpenClaw को मैन्युअल अपडेट के लिए सेट अप करता है; मानक प्रक्रिया के लिए [अपडेट करना](/hi/install/updating) देखें।

प्लेबुक को फिर से चलाने के लिए (उदाहरण के लिए, कॉन्फ़िगरेशन में बदलाव के बाद):

```bash
cd openclaw-ansible
./run-playbook.sh
```

यह आइडेम्पोटेंट है और इसे कई बार चलाना सुरक्षित है।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="फ़ायरवॉल मेरा कनेक्शन अवरुद्ध करता है">
    - पहले Tailscale VPN के माध्यम से कनेक्ट करें; डिज़ाइन के अनुसार Gateway केवल इसी तरह पहुँच योग्य है।
    - SSH (पोर्ट 22) की हमेशा अनुमति होती है।

  </Accordion>
  <Accordion title="सेवा शुरू नहीं होती">
    ```bash
    # लॉग जाँचें
    sudo journalctl -u openclaw -n 100

    # अनुमतियाँ सत्यापित करें
    sudo ls -la /opt/openclaw

    # मैन्युअल शुरुआत का परीक्षण करें
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker सैंडबॉक्स संबंधी समस्याएँ">
    ```bash
    # सत्यापित करें कि Docker चल रहा है
    sudo systemctl status docker

    # सैंडबॉक्स इमेज जाँचें
    sudo docker images | grep openclaw-sandbox

    # अनुपस्थित होने पर सैंडबॉक्स इमेज बनाएँ (सोर्स चेकआउट आवश्यक है)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # सोर्स चेकआउट के बिना npm इंस्टॉलेशन के लिए, देखें
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="चैनल लॉगिन विफल होता है">
    सुनिश्चित करें कि आप `openclaw` उपयोगकर्ता के रूप में चला रहे हैं:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## उन्नत कॉन्फ़िगरेशन

विस्तृत सुरक्षा आर्किटेक्चर और समस्या निवारण के लिए openclaw-ansible रिपॉज़िटरी देखें:

- [सुरक्षा आर्किटेक्चर](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [तकनीकी विवरण](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [समस्या निवारण मार्गदर्शिका](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## संबंधित

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): संपूर्ण डिप्लॉयमेंट मार्गदर्शिका
- [Docker](/hi/install/docker): कंटेनरीकृत Gateway सेटअप
- [सैंडबॉक्सिंग](/hi/gateway/sandboxing): एजेंट सैंडबॉक्स कॉन्फ़िगरेशन
- [मल्टी-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools): प्रति-एजेंट पृथक्करण
