---
read_when:
    - Vuoi che OpenClaw sia in esecuzione 24 ore su 24, 7 giorni su 7, su Azure con il rafforzamento del Network Security Group
    - Vuoi un Gateway OpenClaw di livello produttivo, sempre attivo, sulla tua VM Linux Azure
    - Vuoi un'amministrazione sicura tramite SSH con Azure Bastion
summary: Esegui OpenClaw Gateway 24 ore su 24, 7 giorni su 7, su una VM Linux di Azure con stato persistente
title: Azure
x-i18n:
    generated_at: "2026-07-12T07:10:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Configura una VM Linux di Azure con la CLI di Azure, applica il rafforzamento della sicurezza del gruppo di sicurezza di rete (NSG), configura Azure Bastion per l'accesso SSH e installa OpenClaw.

## Cosa farai

- Creerai le risorse di rete di Azure (VNet, subnet, NSG) e di calcolo con la CLI di Azure
- Applicherai regole NSG affinché l'accesso SSH alla VM sia consentito solo da Azure Bastion
- Utilizzerai Azure Bastion per l'accesso SSH (senza IP pubblico sulla VM)
- Installerai OpenClaw con lo script di installazione
- Verificherai il Gateway

## Cosa ti serve

- Una sottoscrizione di Azure con l'autorizzazione a creare risorse di calcolo e di rete
- La CLI di Azure installata (consulta la [procedura di installazione della CLI di Azure](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Una coppia di chiavi SSH (questa guida spiega come generarne una, se necessario)
- Circa 20-30 minuti

## Configurare la distribuzione

<Steps>
  <Step title="Accedi alla CLI di Azure">
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

    Verifica la registrazione; attendi finché entrambi non mostrano `Registered`.

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

    Adatta i nomi e gli intervalli CIDR al tuo ambiente. La subnet di Bastion deve essere almeno `/26`.

  </Step>

  <Step title="Seleziona una chiave SSH">
    Se ne hai una, utilizza la tua chiave pubblica esistente:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    In caso contrario, generane una:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Seleziona le dimensioni della VM e del disco del sistema operativo">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Inizia con dimensioni ridotte per un utilizzo leggero e aumentale in seguito.
    - Utilizza più vCPU, RAM e spazio su disco per automazioni più impegnative, più canali o carichi di lavoro più grandi per modelli e strumenti.
    - Se una dimensione non è disponibile nella tua area o nella quota della sottoscrizione, scegli lo SKU disponibile più simile.

    Elenca le dimensioni delle VM disponibili nell'area di destinazione:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Controlla l'utilizzo e la quota correnti di vCPU e dischi:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Distribuire le risorse di Azure

<Steps>
  <Step title="Crea il gruppo di risorse">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Crea il gruppo di sicurezza di rete">
    Crea l'NSG e aggiungi regole affinché solo la subnet di Bastion possa accedere alla VM tramite SSH.

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

    Le regole vengono valutate in base alla priorità, a partire dal numero più basso: il traffico di Bastion è consentito con priorità 100, quindi tutto l'altro traffico SSH viene bloccato con priorità 110 e 120.

  </Step>

  <Step title="Crea la rete virtuale e le subnet">
    Crea la VNet con la subnet della VM (con l'NSG associato), quindi aggiungi la subnet di Bastion.

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

    # AzureBastionSubnet: this exact name is required by Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Crea la VM">
    Alla VM non viene assegnato alcun IP pubblico. L'accesso SSH avviene esclusivamente tramite Azure Bastion.

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

    `--public-ip-address ""` impedisce l'assegnazione di un IP pubblico. `--nsg ""` evita la creazione di un NSG per la singola scheda di rete, poiché la sicurezza è già gestita dall'NSG a livello di subnet.

    Per fissare una versione specifica dell'immagine Ubuntu invece di `latest`, elenca prima le versioni disponibili:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Crea Azure Bastion">
    Azure Bastion fornisce un accesso SSH gestito senza esporre un IP pubblico sulla VM. Per utilizzare `az network bastion ssh` dalla CLI sono necessari lo SKU Standard e il tunneling abilitato.

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

    Il provisioning di Bastion richiede in genere 5-10 minuti, ma in alcune aree può richiedere fino a 15-30 minuti.

  </Step>
</Steps>

## Installare OpenClaw

<Steps>
  <Step title="Accedi alla VM tramite SSH con Azure Bastion">
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

    Il programma di installazione installa Node e le dipendenze, se non sono già presenti, installa OpenClaw e avvia la configurazione iniziale. Per i dettagli, consulta [Installazione](/it/install).

  </Step>

  <Step title="Verifica il Gateway">
    Al termine della configurazione iniziale:

    ```bash
    openclaw gateway status
    ```

    Se la tua organizzazione dispone già di licenze GitHub Copilot, durante la configurazione iniziale puoi scegliere il provider GitHub Copilot invece di utilizzare una chiave API separata per il modello. Consulta [Provider GitHub Copilot](/it/providers/github-copilot).

  </Step>
</Steps>

## Considerazioni sui costi

Costi mensili approssimativi (verifica i prezzi correnti nel calcolatore dei prezzi di Azure, poiché le tariffe variano in base all'area e cambiano nel tempo):

- SKU Standard di Azure Bastion: circa 140 USD al mese
- VM (`Standard_B2as_v2`): circa 55 USD al mese

Per ridurre i costi:

- Dealloca la VM quando non viene utilizzata. In questo modo la fatturazione delle risorse di calcolo viene interrotta, mentre i costi del disco rimangono. Il Gateway non è raggiungibile mentre la VM è deallocata.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- Elimina Bastion quando non è necessario e ricrealo quando ti serve nuovamente l'accesso SSH; è il componente più costoso e il provisioning richiede pochi minuti.
- Utilizza lo SKU Basic di Bastion (circa 38 USD al mese) se ti serve solo l'accesso SSH dal portale e non hai bisogno del tunneling tramite CLI (`az network bastion ssh`).

## Pulizia

Elimina tutte le risorse create da questa guida:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Questa operazione rimuove il gruppo di risorse e tutto ciò che contiene (VM, VNet, NSG, Bastion, IP pubblico).

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Associa i dispositivi locali come nodi: [Nodi](/it/nodes)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Maggiori dettagli sulla distribuzione in Azure con il provider di modelli GitHub Copilot: [OpenClaw su Azure con GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [GCP](/it/install/gcp)
- [DigitalOcean](/it/install/digitalocean)
