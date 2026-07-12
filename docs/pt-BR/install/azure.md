---
read_when:
    - Você quer o OpenClaw em execução 24 horas por dia, 7 dias por semana, no Azure, com reforço de segurança por meio de um Grupo de Segurança de Rede
    - Você quer um Gateway OpenClaw de nível de produção, sempre ativo, em sua própria VM Linux do Azure
    - Você quer uma administração segura com SSH do Azure Bastion
summary: Execute o Gateway do OpenClaw 24 horas por dia, 7 dias por semana, em uma VM Linux do Azure com estado persistente
title: Azure
x-i18n:
    generated_at: "2026-07-12T00:04:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Configure uma VM Linux do Azure com a CLI do Azure, aplique reforço de segurança ao Grupo de Segurança de Rede (NSG), configure o Azure Bastion para acesso SSH e instale o OpenClaw.

## O que você fará

- Criar recursos de rede do Azure (VNet, sub-redes, NSG) e de computação com a CLI do Azure
- Aplicar regras de NSG para permitir SSH na VM somente pelo Azure Bastion
- Usar o Azure Bastion para acesso SSH (sem IP público na VM)
- Instalar o OpenClaw com o script de instalação
- Verificar o Gateway

## O que você precisa

- Uma assinatura do Azure com permissão para criar recursos de computação e rede
- CLI do Azure instalada (consulte as [etapas de instalação da CLI do Azure](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Um par de chaves SSH (este guia explica como gerar um, se necessário)
- Cerca de 20 a 30 minutos

## Configurar a implantação

<Steps>
  <Step title="Entrar na CLI do Azure">
    ```bash
    az login
    az extension add -n ssh
    ```

    A extensão `ssh` é necessária para o túnel SSH nativo do Azure Bastion.

  </Step>

  <Step title="Registrar os provedores de recursos necessários (uma única vez)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifique o registro; aguarde até que ambos mostrem `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Definir as variáveis de implantação">
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

    Ajuste os nomes e os intervalos CIDR de acordo com seu ambiente. A sub-rede do Bastion deve ser, no mínimo, `/26`.

  </Step>

  <Step title="Selecionar uma chave SSH">
    Use sua chave pública existente, caso tenha uma:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Caso contrário, gere uma:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Selecionar o tamanho da VM e do disco do sistema operacional">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Comece com uma configuração menor para uso leve e aumente-a posteriormente.
    - Use mais vCPU, RAM e disco para automações mais pesadas, mais canais ou cargas maiores de modelos e ferramentas.
    - Se um tamanho não estiver disponível em sua região ou na cota da assinatura, escolha o SKU disponível mais próximo.

    Liste os tamanhos de VM disponíveis na região de destino:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Verifique o uso e a cota atuais de vCPU e disco:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Implantar recursos do Azure

<Steps>
  <Step title="Criar o grupo de recursos">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Criar o grupo de segurança de rede">
    Crie o NSG e adicione regras para que somente a sub-rede do Bastion possa acessar a VM por SSH.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Permitir SSH somente da sub-rede do Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Negar SSH da internet pública
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Negar SSH de outras origens da VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    As regras são avaliadas por prioridade, começando pelo menor número: o tráfego do Bastion é permitido na prioridade 100 e todo o restante do tráfego SSH é bloqueado nas prioridades 110 e 120.

  </Step>

  <Step title="Criar a rede virtual e as sub-redes">
    Crie a VNet com a sub-rede da VM (com o NSG associado) e depois adicione a sub-rede do Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Associar o NSG à sub-rede da VM
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: este nome exato é exigido pelo Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Criar a VM">
    A VM não recebe um IP público. O acesso SSH ocorre exclusivamente pelo Azure Bastion.

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

    `--public-ip-address ""` impede a atribuição de um IP público. `--nsg ""` ignora a criação de um NSG por interface de rede, pois o NSG no nível da sub-rede já gerencia a segurança.

    Para fixar uma versão específica da imagem do Ubuntu em vez de `latest`, primeiro liste as versões disponíveis:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Criar o Azure Bastion">
    O Azure Bastion fornece acesso SSH gerenciado sem expor um IP público na VM. O SKU Standard, com túnel habilitado, é necessário para usar `az network bastion ssh` pela CLI.

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

    O provisionamento do Bastion normalmente leva de 5 a 10 minutos, mas pode levar de 15 a 30 minutos em algumas regiões.

  </Step>
</Steps>

## Instalar o OpenClaw

<Steps>
  <Step title="Acessar a VM por SSH pelo Azure Bastion">
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

  <Step title="Instalar o OpenClaw (no shell da VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    O instalador instala o Node e as dependências, caso ainda não estejam presentes, instala o OpenClaw e inicia a configuração inicial. Consulte [Instalação](/pt-BR/install) para obter detalhes.

  </Step>

  <Step title="Verificar o Gateway">
    Após a conclusão da configuração inicial:

    ```bash
    openclaw gateway status
    ```

    Se sua organização já tiver licenças do GitHub Copilot, você poderá escolher o provedor GitHub Copilot durante a configuração inicial, em vez de usar uma chave de API separada para o modelo. Consulte [Provedor GitHub Copilot](/pt-BR/providers/github-copilot).

  </Step>
</Steps>

## Considerações de custo

Custos mensais aproximados (confirme os preços atuais na Calculadora de Preços do Azure, pois as tarifas variam por região e mudam ao longo do tempo):

- SKU Standard do Azure Bastion: cerca de US$ 140/mês
- VM (`Standard_B2as_v2`): cerca de US$ 55/mês

Para reduzir custos:

- Desaloque a VM quando ela não estiver em uso. Isso interrompe a cobrança de computação (as cobranças de disco permanecem). O Gateway fica inacessível enquanto a VM estiver desalocada.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # reiniciar posteriormente
  ```

- Exclua o Bastion quando ele não for necessário e recrie-o quando precisar novamente de acesso SSH; ele é o maior componente de custo e leva alguns minutos para ser provisionado.
- Use o SKU Basic do Bastion (cerca de US$ 38/mês) se você precisar apenas de SSH pelo Portal e não precisar de túnel pela CLI (`az network bastion ssh`).

## Limpeza

Exclua todos os recursos criados por este guia:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Isso remove o grupo de recursos e tudo o que está contido nele (VM, VNet, NSG, Bastion e IP público).

## Próximas etapas

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Emparelhe dispositivos locais como nós: [Nós](/pt-BR/nodes)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mais detalhes sobre a implantação no Azure com o provedor de modelos GitHub Copilot: [OpenClaw no Azure com GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [GCP](/pt-BR/install/gcp)
- [DigitalOcean](/pt-BR/install/digitalocean)
