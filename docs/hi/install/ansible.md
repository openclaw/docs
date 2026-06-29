---
read_when:
    - आप सुरक्षा सुदृढ़ीकरण के साथ स्वचालित सर्वर डिप्लॉयमेंट चाहते हैं
    - आपको VPN एक्सेस के साथ फ़ायरवॉल-पृथक सेटअप चाहिए
    - आप दूरस्थ Debian/Ubuntu सर्वरों पर डिप्लॉय कर रहे हैं
summary: Ansible, Tailscale VPN और फ़ायरवॉल आइसोलेशन के साथ स्वचालित, सुदृढ़ OpenClaw स्थापना
title: Ansible
x-i18n:
    generated_at: "2026-06-28T23:18:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

सुरक्षा-प्रथम आर्किटेक्चर वाले स्वचालित इंस्टॉलर **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** के साथ OpenClaw को उत्पादन सर्वरों पर तैनात करें।

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) रेपो Ansible परिनियोजन के लिए सत्य का स्रोत है। यह पृष्ठ एक त्वरित अवलोकन है।
</Info>

## पूर्वापेक्षाएँ

| आवश्यकता   | विवरण                                                    |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ या Ubuntu 20.04+                               |
| **पहुँच**   | Root या sudo विशेषाधिकार                                  |
| **नेटवर्क** | पैकेज इंस्टॉलेशन के लिए इंटरनेट कनेक्शन                   |
| **Ansible** | 2.14+ (क्विक-स्टार्ट स्क्रिप्ट द्वारा अपने-आप इंस्टॉल) |

## आपको क्या मिलता है

- **Firewall-प्रथम सुरक्षा** -- UFW + Docker आइसोलेशन (केवल SSH + Tailscale पहुँच योग्य)
- **Tailscale VPN** -- सेवाओं को सार्वजनिक रूप से उजागर किए बिना सुरक्षित रिमोट पहुँच
- **Docker** -- आइसोलेटेड सैंडबॉक्स कंटेनर, केवल localhost बाइंडिंग
- **गहन रक्षा** -- 4-स्तरीय सुरक्षा आर्किटेक्चर
- **Systemd एकीकरण** -- हार्डनिंग के साथ बूट पर ऑटो-स्टार्ट
- **एक-कमांड सेटअप** -- मिनटों में पूरा परिनियोजन

## त्वरित शुरुआत

एक-कमांड इंस्टॉल:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## क्या इंस्टॉल होता है

Ansible playbook इंस्टॉल और कॉन्फ़िगर करता है:

1. **Tailscale** -- सुरक्षित रिमोट पहुँच के लिए mesh VPN
2. **UFW firewall** -- केवल SSH + Tailscale पोर्ट
3. **Docker CE + Compose V2** -- डिफ़ॉल्ट एजेंट सैंडबॉक्स बैकएंड के लिए
4. **Node.js 24 + pnpm** -- रनटाइम निर्भरताएँ (Node 22 LTS, वर्तमान में `22.19+`, समर्थित रहता है)
5. **OpenClaw** -- होस्ट-आधारित, कंटेनरीकृत नहीं
6. **Systemd सेवा** -- सुरक्षा हार्डनिंग के साथ ऑटो-स्टार्ट

<Note>
Gateway सीधे होस्ट पर चलता है (Docker में नहीं)। एजेंट सैंडबॉक्सिंग
वैकल्पिक है; यह playbook Docker इंस्टॉल करता है क्योंकि यह डिफ़ॉल्ट सैंडबॉक्स
बैकएंड है। विवरण और अन्य बैकएंड के लिए [Sandboxing](/hi/gateway/sandboxing) देखें।
</Note>

## इंस्टॉल के बाद सेटअप

<Steps>
  <Step title="openclaw उपयोगकर्ता पर स्विच करें">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="ऑनबोर्डिंग विज़ार्ड चलाएँ">
    पोस्ट-इंस्टॉल स्क्रिप्ट आपको OpenClaw सेटिंग्स कॉन्फ़िगर करने में मार्गदर्शन करती है।
  </Step>
  <Step title="मैसेजिंग प्रदाताओं को कनेक्ट करें">
    WhatsApp, Telegram, Discord, या Signal में लॉग इन करें:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="इंस्टॉलेशन सत्यापित करें">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscale से कनेक्ट करें">
    सुरक्षित रिमोट पहुँच के लिए अपने VPN mesh से जुड़ें।
  </Step>
</Steps>

### त्वरित कमांड

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## सुरक्षा आर्किटेक्चर

परिनियोजन 4-स्तरीय रक्षा मॉडल का उपयोग करता है:

1. **Firewall (UFW)** -- केवल SSH (22) + Tailscale (41641/udp) सार्वजनिक रूप से उजागर
2. **VPN (Tailscale)** -- Gateway केवल VPN mesh के माध्यम से पहुँच योग्य
3. **Docker आइसोलेशन** -- DOCKER-USER iptables चेन बाहरी पोर्ट एक्सपोज़र रोकती है
4. **Systemd हार्डनिंग** -- NoNewPrivileges, PrivateTmp, विशेषाधिकार-रहित उपयोगकर्ता

अपनी बाहरी अटैक सतह सत्यापित करने के लिए:

```bash
nmap -p- YOUR_SERVER_IP
```

केवल पोर्ट 22 (SSH) खुला होना चाहिए। अन्य सभी सेवाएँ (Gateway, Docker) लॉक डाउन रहती हैं।

Docker एजेंट सैंडबॉक्स (आइसोलेटेड टूल निष्पादन) के लिए इंस्टॉल होता है, Gateway स्वयं चलाने के लिए नहीं। सैंडबॉक्स कॉन्फ़िगरेशन के लिए [Multi-Agent Sandbox and Tools](/hi/tools/multi-agent-sandbox-tools) देखें।

## मैनुअल इंस्टॉलेशन

यदि आप स्वचालन पर मैनुअल नियंत्रण पसंद करते हैं:

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
  <Step title="Ansible collections इंस्टॉल करें">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="playbook चलाएँ">
    ```bash
    ./run-playbook.sh
    ```

    वैकल्पिक रूप से, सीधे चलाएँ और फिर बाद में सेटअप स्क्रिप्ट मैनुअली निष्पादित करें:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## अपडेट करना

Ansible इंस्टॉलर OpenClaw को मैनुअल अपडेट के लिए सेट करता है। मानक अपडेट प्रवाह के लिए [Updating](/hi/install/updating) देखें।

Ansible playbook फिर से चलाने के लिए (उदाहरण के लिए, कॉन्फ़िगरेशन बदलावों के लिए):

```bash
cd openclaw-ansible
./run-playbook.sh
```

यह idempotent है और कई बार चलाना सुरक्षित है।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Firewall मेरा कनेक्शन ब्लॉक करता है">
    - सुनिश्चित करें कि पहले आप Tailscale VPN के माध्यम से पहुँच सकते हैं
    - SSH पहुँच (पोर्ट 22) हमेशा अनुमत है
    - Gateway डिज़ाइन के अनुसार केवल Tailscale के माध्यम से पहुँच योग्य है

  </Accordion>
  <Accordion title="सेवा शुरू नहीं होगी">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker सैंडबॉक्स समस्याएँ">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="प्रदाता लॉगिन विफल होता है">
    सुनिश्चित करें कि आप `openclaw` उपयोगकर्ता के रूप में चला रहे हैं:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## उन्नत कॉन्फ़िगरेशन

विस्तृत सुरक्षा आर्किटेक्चर और समस्या निवारण के लिए, openclaw-ansible रेपो देखें:

- [सुरक्षा आर्किटेक्चर](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [तकनीकी विवरण](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [समस्या निवारण गाइड](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## संबंधित

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- पूर्ण परिनियोजन गाइड
- [Docker](/hi/install/docker) -- कंटेनरीकृत Gateway सेटअप
- [Sandboxing](/hi/gateway/sandboxing) -- एजेंट सैंडबॉक्स कॉन्फ़िगरेशन
- [Multi-Agent Sandbox and Tools](/hi/tools/multi-agent-sandbox-tools) -- प्रति-एजेंट आइसोलेशन
