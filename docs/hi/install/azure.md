---
read_when:
    - आप Azure पर Network Security Group की सुरक्षा मज़बूती के साथ OpenClaw को 24/7 चलाना चाहते हैं
    - आप अपनी Azure Linux VM पर उत्पादन-स्तरीय, हमेशा चालू रहने वाला OpenClaw Gateway चाहते हैं
    - आप Azure Bastion SSH के साथ सुरक्षित प्रशासन चाहते हैं
summary: स्थायी स्थिति के साथ Azure Linux VM पर OpenClaw Gateway को 24/7 चलाएँ
title: Azure
x-i18n:
    generated_at: "2026-07-16T15:30:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Azure CLI के साथ Azure Linux VM सेट अप करें, Network Security Group (NSG) की सुरक्षा सुदृढ़ करें, SSH पहुँच के लिए Azure Bastion कॉन्फ़िगर करें और OpenClaw इंस्टॉल करें।

## आप क्या करेंगे

- Azure CLI के साथ Azure नेटवर्किंग (VNet, सबनेट, NSG) और कंप्यूट संसाधन बनाएँगे
- NSG नियम लागू करेंगे, ताकि VM पर SSH की अनुमति केवल Azure Bastion से हो
- SSH पहुँच के लिए Azure Bastion का उपयोग करेंगे (VM पर कोई सार्वजनिक IP नहीं)
- इंस्टॉलर स्क्रिप्ट से OpenClaw इंस्टॉल करेंगे
- Gateway सत्यापित करेंगे

## आपको क्या चाहिए

- कंप्यूट और नेटवर्क संसाधन बनाने की अनुमति वाली Azure सदस्यता
- Azure CLI इंस्टॉल किया हुआ हो ([Azure CLI इंस्टॉल करने के चरण](https://learn.microsoft.com/cli/azure/install-azure-cli) देखें)
- एक SSH कुंजी युग्म (आवश्यकता होने पर इसे जनरेट करना इस मार्गदर्शिका में बताया गया है)
- लगभग 20-30 मिनट

## डिप्लॉयमेंट कॉन्फ़िगर करें

<Steps>
  <Step title="Azure CLI में साइन इन करें">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion की नेटिव SSH टनलिंग के लिए `ssh` एक्सटेंशन आवश्यक है।

  </Step>

  <Step title="आवश्यक संसाधन प्रदाताओं को पंजीकृत करें (एक बार)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    पंजीकरण सत्यापित करें; दोनों में `Registered` दिखाई देने तक प्रतीक्षा करें।

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="डिप्लॉयमेंट वेरिएबल सेट करें">
    ```bash
    RG="rg-openclaw"
    LOCATION="westus2"
    VNET_NAME="vnet-openclaw"
    VNET_PREFIX="10.40.0.0/16"
    VM_SUBNET_NAME="snet-openclaw-vm"
    VM_SUBNET_PREFIX="10.40.2.0/24"
    BASTION_SUBNET_PREFIX="10.40.1.0/26"
    NSG_NAME="nsg-openclaw-vm"
    VM_NAME="vm-openclaw"
    ADMIN_USERNAME="openclaw"
    BASTION_NAME="bas-openclaw"
    BASTION_PIP_NAME="pip-openclaw-bastion"
    ```

    अपने परिवेश के अनुसार नाम और CIDR रेंज समायोजित करें। Bastion सबनेट कम-से-कम `/26` होना चाहिए।

  </Step>

  <Step title="SSH कुंजी चुनें">
    यदि आपके पास मौजूदा सार्वजनिक कुंजी है, तो उसका उपयोग करें:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    अन्यथा, एक कुंजी जनरेट करें:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM का आकार और OS डिस्क का आकार चुनें">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - हल्के उपयोग के लिए छोटे आकार से शुरू करें और बाद में क्षमता बढ़ाएँ।
    - अधिक भार वाले ऑटोमेशन, अधिक चैनलों या बड़े मॉडल/टूल वर्कलोड के लिए अधिक vCPU/RAM/डिस्क का उपयोग करें।
    - यदि आपके क्षेत्र या सदस्यता कोटा में कोई आकार उपलब्ध नहीं है, तो निकटतम उपलब्ध SKU चुनें।

    अपने लक्षित क्षेत्र में उपलब्ध VM आकारों की सूची देखें:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    अपने वर्तमान vCPU और डिस्क उपयोग/कोटा की जाँच करें:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure संसाधन डिप्लॉय करें

<Steps>
  <Step title="संसाधन समूह बनाएँ">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="नेटवर्क सुरक्षा समूह बनाएँ">
    NSG बनाएँ और नियम जोड़ें, ताकि केवल Bastion सबनेट ही VM में SSH कर सके।

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # केवल Bastion सबनेट से SSH की अनुमति दें
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # सार्वजनिक इंटरनेट से SSH अस्वीकार करें
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # अन्य VNet स्रोतों से SSH अस्वीकार करें
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    नियमों का मूल्यांकन प्राथमिकता के अनुसार किया जाता है, जिसमें सबसे छोटी संख्या पहले आती है: Bastion ट्रैफ़िक को 100 पर अनुमति दी जाती है, फिर अन्य सभी SSH को 110 और 120 पर अवरुद्ध किया जाता है।

  </Step>

  <Step title="वर्चुअल नेटवर्क और सबनेट बनाएँ">
    VM सबनेट (NSG संलग्न) के साथ VNet बनाएँ, फिर Bastion सबनेट जोड़ें।

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # NSG को VM सबनेट से संलग्न करें
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: Azure को यही सटीक नाम आवश्यक है
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VM बनाएँ">
    VM को कोई सार्वजनिक IP नहीं मिलता। SSH पहुँच विशेष रूप से Azure Bastion के माध्यम से होती है।

    ```bash
    az vm create \
      -g "${RG}" -n "${VM_NAME}" -l "${LOCATION}" \
      --image "Canonical:ubuntu-24_04-lts:server:latest" \
      --size "${VM_SIZE}" \
      --os-disk-size-gb "${OS_DISK_SIZE_GB}" \
      --storage-sku StandardSSD_LRS \
      --admin-username "${ADMIN_USERNAME}" \
      --ssh-key-values "${SSH_PUB_KEY}" \
      --vnet-name "${VNET_NAME}" \
      --subnet "${VM_SUBNET_NAME}" \
      --public-ip-address "" \
      --nsg ""
    ```

    `--public-ip-address ""` सार्वजनिक IP असाइन होने से रोकता है। चूँकि सबनेट-स्तरीय NSG पहले से सुरक्षा संभालता है, इसलिए `--nsg ""` प्रति-NIC NSG को छोड़ देता है।

    `latest` के बजाय Ubuntu के किसी विशिष्ट इमेज संस्करण को पिन करने के लिए, पहले उपलब्ध संस्करणों की सूची देखें:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion बनाएँ">
    Azure Bastion, VM पर सार्वजनिक IP उजागर किए बिना प्रबंधित SSH पहुँच प्रदान करता है। CLI-आधारित `az network bastion ssh` के लिए टनलिंग सक्षम वाला Standard SKU आवश्यक है।

    ```bash
    az network public-ip create \
      -g "${RG}" -n "${BASTION_PIP_NAME}" -l "${LOCATION}" \
      --sku Standard --allocation-method Static

    az network bastion create \
      -g "${RG}" -n "${BASTION_NAME}" -l "${LOCATION}" \
      --vnet-name "${VNET_NAME}" \
      --public-ip-address "${BASTION_PIP_NAME}" \
      --sku Standard --enable-tunneling true
    ```

    Bastion प्रोविज़निंग में आम तौर पर 5-10 मिनट लगते हैं, लेकिन कुछ क्षेत्रों में 15-30 मिनट तक लग सकते हैं।

  </Step>
</Steps>

## OpenClaw इंस्टॉल करें

<Steps>
  <Step title="Azure Bastion के माध्यम से VM में SSH करें">
    ```bash
    VM_ID="$(az vm show -g "${RG}" -n "${VM_NAME}" --query id -o tsv)"

    az network bastion ssh \
      --name "${BASTION_NAME}" \
      --resource-group "${RG}" \
      --target-resource-id "${VM_ID}" \
      --auth-type ssh-key \
      --username "${ADMIN_USERNAME}" \
      --ssh-key ~/.ssh/id_ed25519
    ```

  </Step>

  <Step title="OpenClaw इंस्टॉल करें (VM शेल में)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    यदि Node और निर्भरताएँ पहले से मौजूद नहीं हैं, तो इंस्टॉलर उन्हें इंस्टॉल करता है, OpenClaw इंस्टॉल करता है और ऑनबोर्डिंग शुरू करता है। विवरण के लिए [इंस्टॉल करें](/hi/install) देखें।

  </Step>

  <Step title="Gateway सत्यापित करें">
    ऑनबोर्डिंग पूरी होने के बाद:

    ```bash
    openclaw gateway status
    ```

    यदि आपके संगठन के पास पहले से GitHub Copilot लाइसेंस हैं, तो आप ऑनबोर्डिंग के दौरान अलग मॉडल API कुंजी के बजाय GitHub Copilot प्रदाता चुन सकते हैं। [GitHub Copilot प्रदाता](/hi/providers/github-copilot) देखें।

  </Step>
</Steps>

## लागत संबंधी विचार

अनुमानित मासिक लागतें (Azure Pricing Calculator में वर्तमान मूल्य सत्यापित करें, क्योंकि दरें क्षेत्र के अनुसार अलग-अलग होती हैं और समय के साथ बदलती हैं):

- Azure Bastion Standard SKU: लगभग $140/माह
- VM (`Standard_B2as_v2`): लगभग $55/माह

लागत कम करने के लिए:

- उपयोग में न होने पर VM को डिअलोकेट करें। इससे कंप्यूट बिलिंग रुक जाती है (डिस्क शुल्क जारी रहता है)। डिअलोकेट रहने के दौरान Gateway तक पहुँचा नहीं जा सकता।

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # बाद में पुनः आरंभ करें
  ```

- आवश्यकता न होने पर Bastion हटाएँ और दोबारा SSH पहुँच की आवश्यकता होने पर उसे फिर से बनाएँ; यह लागत का सबसे बड़ा घटक है और कुछ ही मिनटों में प्रोविज़न हो जाता है।
- यदि आपको केवल Portal-आधारित SSH चाहिए और CLI टनलिंग (`az network bastion ssh`) की आवश्यकता नहीं है, तो Basic Bastion SKU (लगभग $38/माह) का उपयोग करें।

## क्लीनअप

इस मार्गदर्शिका द्वारा बनाए गए सभी संसाधन हटाएँ:

```bash
az group delete -n "${RG}" --yes --no-wait
```

यह संसाधन समूह और उसके भीतर मौजूद सब कुछ (VM, VNet, NSG, Bastion, सार्वजनिक IP) हटा देता है।

## अगले चरण

- मैसेजिंग चैनल सेट अप करें: [चैनल](/hi/channels)
- स्थानीय डिवाइस को Node के रूप में पेयर करें: [Nodes](/hi/nodes)
- Gateway कॉन्फ़िगर करें: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)
- GitHub Copilot मॉडल प्रदाता के साथ Azure डिप्लॉयमेंट का अधिक विवरण: [GitHub Copilot के साथ Azure पर OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## संबंधित

- [इंस्टॉलेशन का अवलोकन](/hi/install)
- [GCP](/hi/install/gcp)
- [DigitalOcean](/hi/install/digitalocean)
