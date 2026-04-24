---
read_when:
    - Vuoi OpenClaw in esecuzione 24/7 su Azure con hardening del Network Security Group
    - |-
      Vuoi un Gateway OpenClaw sempre attivo, di livello produzione, sulla tua VM Linux Azureեփականassistant to=multi_tool_use.parallel in commentary  天天中彩票是  东臣िखាមार्फत  大发快三是国家json
      {"tool_uses":[{"recipient_name":"functions.read","parameters":{"path":"/home/runner/work/docs/docs/source/docs/install/azure.md"}},{"recipient_name":"functions.bash","parameters":{"command":"pwd && rg -n \"Azure|azure\" -S /home/runner/work/docs/docs/source/docs | head -200","timeout":20}}]}
    - Vuoi un'amministrazione sicura con SSH Azure Bastion
summary: Eseguire OpenClaw Gateway 24/7 su una VM Linux Azure con stato persistente
title: Azure
x-i18n:
    generated_at: "2026-04-24T08:45:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw su VM Linux Azure

Questa guida configura una VM Linux Azure con Azure CLI, applica l'hardening del Network Security Group (NSG), configura Azure Bastion per l'accesso SSH e installa OpenClaw.

## Cosa farai

- Creare risorse di rete e calcolo Azure (VNet, subnet, NSG) con Azure CLI
- Applicare regole del Network Security Group in modo che SSH verso la VM sia consentito solo da Azure Bastion
- Usare Azure Bastion per l'accesso SSH (nessun IP pubblico sulla VM)
- Installare OpenClaw con lo script di installazione
- Verificare il Gateway

## Cosa ti serve

- Una sottoscrizione Azure con permessi per creare risorse di calcolo e rete
- Azure CLI installato (vedi [passaggi di installazione di Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) se necessario)
- Una coppia di chiavi SSH (la guida copre anche la generazione, se necessaria)
- ~20-30 minuti

## Configurare la distribuzione

<Steps>
  <Step title="Accedi ad Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    L'estensione `ssh` è necessaria per il tunneling SSH nativo di Azure Bastion.

  </Step>

  <Step title="Registra i provider di risorse richiesti (una sola volta)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifica la registrazione. Attendi finché entrambi mostrano `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Imposta le variabili di distribuzione">
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

    Modifica nomi e intervalli CIDR in base al tuo ambiente. La subnet Bastion deve essere almeno `/26`.

  </Step>

  <Step title="Seleziona la chiave SSH">
    Usa la tua chiave pubblica esistente, se ne hai una:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Se non hai ancora una chiave SSH, generane una:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Seleziona dimensione della VM e dimensione del disco OS">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Scegli una dimensione della VM e una dimensione del disco OS disponibili nella tua sottoscrizione e nella tua area:

    - Inizia con una dimensione più piccola per un uso leggero e aumenta in seguito
    - Usa più vCPU/RAM/disco per automazioni più pesanti, più canali o carichi di lavoro modello/strumenti più grandi
    - Se una dimensione della VM non è disponibile nella tua area o nella quota della sottoscrizione, scegli lo SKU disponibile più vicino

    Elenca le dimensioni delle VM disponibili nella tua area di destinazione:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Controlla l'utilizzo e la quota correnti di vCPU e disco:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Distribuire le risorse Azure

<Steps>
  <Step title="Crea il gruppo di risorse">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Crea il network security group">
    Crea l'NSG e aggiungi regole in modo che solo la subnet Bastion possa accedere via SSH alla VM.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Allow SSH from the Bastion subnet only
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Deny SSH from the public internet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Deny SSH from other VNet sources
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Le regole vengono valutate per priorità (numero più basso prima): il traffico Bastion è consentito a 100, poi tutto il resto del traffico SSH viene bloccato a 110 e 120.

  </Step>

  <Step title="Crea la rete virtuale e le subnet">
    Crea la VNet con la subnet della VM (NSG collegato), poi aggiungi la subnet Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Attach the NSG to the VM subnet
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — name is required by Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Crea la VM">
    La VM non ha un IP pubblico. L'accesso SSH avviene esclusivamente tramite Azure Bastion.

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

    `--public-ip-address ""` impedisce l'assegnazione di un IP pubblico. `--nsg ""` evita la creazione di un NSG per-NIC (la sicurezza è gestita dall'NSG a livello di subnet).

    **Riproducibilità:** il comando sopra usa `latest` per l'immagine Ubuntu. Per bloccare una versione specifica, elenca le versioni disponibili e sostituisci `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Crea Azure Bastion">
    Azure Bastion fornisce accesso SSH gestito alla VM senza esporre un IP pubblico. Lo SKU Standard con tunneling è richiesto per `az network bastion ssh` basato su CLI.

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

    Il provisioning di Bastion richiede in genere 5-10 minuti ma in alcune aree può richiedere fino a 15-30 minuti.

  </Step>
</Steps>

## Installare OpenClaw

<Steps>
  <Step title="Accedi via SSH alla VM tramite Azure Bastion">
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

  <Step title="Installa OpenClaw (nella shell della VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Il programma di installazione installa Node LTS e le dipendenze se non sono già presenti, installa OpenClaw e avvia la procedura guidata di onboarding. Vedi [Install](/it/install) per i dettagli.

  </Step>

  <Step title="Verifica il Gateway">
    Dopo il completamento dell'onboarding:

    ```bash
    openclaw gateway status
    ```

    La maggior parte dei team enterprise su Azure dispone già di licenze GitHub Copilot. Se è il tuo caso, consigliamo di scegliere il provider GitHub Copilot nella procedura guidata di onboarding di OpenClaw. Vedi [GitHub Copilot provider](/it/providers/github-copilot).

  </Step>
</Steps>

## Considerazioni sui costi

Azure Bastion SKU Standard costa circa **\$140/mese** e la VM (Standard_B2as_v2) costa circa **\$55/mese**.

Per ridurre i costi:

- **Dealloca la VM** quando non è in uso (ferma il costo di calcolo; i costi disco rimangono). Il Gateway OpenClaw non sarà raggiungibile mentre la VM è deallocata — riavvialo quando ti serve di nuovo attivo:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Elimina Bastion quando non serve** e ricrealo quando ti serve accesso SSH. Bastion è la componente di costo più alta e richiede solo pochi minuti per il provisioning.
- **Usa lo SKU Basic di Bastion** (~\$38/mese) se ti serve solo SSH basato su Portale e non hai bisogno del tunneling CLI (`az network bastion ssh`).

## Cleanup

Per eliminare tutte le risorse create da questa guida:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Questo rimuove il gruppo di risorse e tutto ciò che contiene (VM, VNet, NSG, Bastion, IP pubblico).

## Passi successivi

- Configura i canali di messaggistica: [Channels](/it/channels)
- Associa i dispositivi locali come Node: [Nodes](/it/nodes)
- Configura il Gateway: [Gateway configuration](/it/gateway/configuration)
- Per maggiori dettagli sulla distribuzione Azure di OpenClaw con il provider di modelli GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Correlati

- [Panoramica dell'installazione](/it/install)
- [GCP](/it/install/gcp)
- [DigitalOcean](/it/install/digitalocean)
