---
read_when:
    - Quieres que OpenClaw se ejecute 24/7 en Azure con endurecimiento de Network Security Group
    - Quieres un Gateway de OpenClaw siempre activo y de nivel de producción en tu propia VM Linux de Azure
    - Quiere administración segura con Azure Bastion SSH
summary: Ejecuta OpenClaw Gateway 24/7 en una VM Linux de Azure con estado duradero
title: Azure
x-i18n:
    generated_at: "2026-07-05T11:26:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Configura una VM Linux de Azure con Azure CLI, aplica endurecimiento de Network Security Group (NSG), configura Azure Bastion para acceso SSH e instala OpenClaw.

## Qué harás

- Crear recursos de red de Azure (VNet, subredes, NSG) y de cómputo con Azure CLI
- Aplicar reglas de NSG para que el SSH de la VM se permita solo desde Azure Bastion
- Usar Azure Bastion para el acceso SSH (sin IP pública en la VM)
- Instalar OpenClaw con el script de instalación
- Verificar el Gateway

## Qué necesitas

- Una suscripción de Azure con permiso para crear recursos de cómputo y red
- Azure CLI instalado (consulta los [pasos de instalación de Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Un par de claves SSH (esta guía cubre cómo generar uno si es necesario)
- Aproximadamente 20-30 minutos

## Configurar la implementación

<Steps>
  <Step title="Inicia sesión en Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    La extensión `ssh` es necesaria para el tunelado SSH nativo de Azure Bastion.

  </Step>

  <Step title="Registra los proveedores de recursos necesarios (una vez)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifica el registro; espera hasta que ambos muestren `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Define las variables de implementación">
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

    Ajusta los nombres y rangos CIDR para que se adapten a tu entorno. La subred de Bastion debe ser al menos `/26`.

  </Step>

  <Step title="Selecciona una clave SSH">
    Usa tu clave pública existente si tienes una:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    De lo contrario, genera una:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Selecciona el tamaño de la VM y el tamaño del disco del SO">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Empieza con un tamaño más pequeño para uso ligero y escala más adelante.
    - Usa más vCPU/RAM/disco para automatización más intensa, más canales o cargas de trabajo de modelos/herramientas más grandes.
    - Si un tamaño no está disponible en tu región o cuota de suscripción, elige la SKU disponible más cercana.

    Lista los tamaños de VM disponibles en tu región de destino:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Comprueba tu uso/cuota actual de vCPU y disco:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Implementar recursos de Azure

<Steps>
  <Step title="Crea el grupo de recursos">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Crea el grupo de seguridad de red">
    Crea el NSG y añade reglas para que solo la subred de Bastion pueda hacer SSH en la VM.

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

    Las reglas se evalúan por prioridad, con el número más bajo primero: el tráfico de Bastion se permite en 100, luego todo el resto del SSH se bloquea en 110 y 120.

  </Step>

  <Step title="Crea la red virtual y las subredes">
    Crea la VNet con la subred de la VM (NSG adjunto), luego añade la subred de Bastion.

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
    La VM no obtiene IP pública. El acceso SSH pasa exclusivamente por Azure Bastion.

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

    `--public-ip-address ""` evita que se asigne una IP pública. `--nsg ""` omite un NSG por NIC, ya que el NSG a nivel de subred ya gestiona la seguridad.

    Para fijar una versión específica de imagen de Ubuntu en lugar de `latest`, lista primero las versiones disponibles:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Crea Azure Bastion">
    Azure Bastion proporciona acceso SSH gestionado sin exponer una IP pública en la VM. La SKU Standard con tunelado habilitado es necesaria para `az network bastion ssh` basado en CLI.

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

    El aprovisionamiento de Bastion normalmente tarda 5-10 minutos, pero puede tardar hasta 15-30 minutos en algunas regiones.

  </Step>
</Steps>

## Instalar OpenClaw

<Steps>
  <Step title="Conéctate por SSH a la VM mediante Azure Bastion">
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

  <Step title="Instala OpenClaw (en la shell de la VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    El instalador instala Node y las dependencias si aún no están presentes, instala OpenClaw e inicia la incorporación. Consulta [Instalación](/es/install) para obtener detalles.

  </Step>

  <Step title="Verifica el Gateway">
    Después de que se complete la incorporación:

    ```bash
    openclaw gateway status
    ```

    Si tu organización ya tiene licencias de GitHub Copilot, puedes elegir el proveedor GitHub Copilot durante la incorporación en lugar de una clave de API de modelo independiente. Consulta [Proveedor GitHub Copilot](/es/providers/github-copilot).

  </Step>
</Steps>

## Consideraciones de coste

Costes mensuales aproximados (verifica los precios actuales en Azure Pricing Calculator, ya que las tarifas varían por región y cambian con el tiempo):

- SKU Standard de Azure Bastion: alrededor de 140 USD/mes
- VM (`Standard_B2as_v2`): alrededor de 55 USD/mes

Para reducir costes:

- Desasigna la VM cuando no esté en uso. Esto detiene la facturación de cómputo (los cargos de disco permanecen). El Gateway no está accesible mientras está desasignada.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- Elimina Bastion cuando no lo necesites y vuelve a crearlo cuando necesites acceso SSH de nuevo; es el componente de mayor coste y se aprovisiona en unos minutos.
- Usa la SKU Basic de Bastion (alrededor de 38 USD/mes) si solo necesitas SSH basado en el Portal y no necesitas tunelado de CLI (`az network bastion ssh`).

## Limpieza

Elimina todos los recursos creados por esta guía:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Esto elimina el grupo de recursos y todo lo que contiene (VM, VNet, NSG, Bastion, IP pública).

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Empareja dispositivos locales como nodos: [Nodos](/es/nodes)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Más detalles sobre la implementación en Azure con el proveedor de modelos GitHub Copilot: [OpenClaw en Azure con GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Relacionado

- [Resumen de instalación](/es/install)
- [GCP](/es/install/gcp)
- [DigitalOcean](/es/install/digitalocean)
