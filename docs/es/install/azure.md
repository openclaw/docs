---
read_when:
    - Quieres OpenClaw ejecutándose 24/7 en Azure con refuerzo de Network Security Group
    - Quieres un Gateway de OpenClaw siempre activo y de nivel de producción en tu propia VM Linux de Azure
    - Quieres administración segura con Azure Bastion SSH
summary: Ejecutar OpenClaw Gateway 24/7 en una VM Linux de Azure con estado duradero
title: Azure
x-i18n:
    generated_at: "2026-04-24T05:33:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw en una VM Linux de Azure

Esta guía configura una VM Linux de Azure con Azure CLI, aplica refuerzo de Network Security Group (NSG), configura Azure Bastion para acceso SSH e instala OpenClaw.

## Qué vas a hacer

- Crear recursos de red y cómputo de Azure (VNet, subredes, NSG) con Azure CLI
- Aplicar reglas de Network Security Group para que el SSH de la VM solo esté permitido desde Azure Bastion
- Usar Azure Bastion para el acceso SSH (sin IP pública en la VM)
- Instalar OpenClaw con el script de instalación
- Verificar Gateway

## Qué necesitas

- Una suscripción de Azure con permiso para crear recursos de cómputo y red
- Azure CLI instalado (consulta [pasos de instalación de Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) si lo necesitas)
- Un par de claves SSH (la guía cubre cómo generarlo si hace falta)
- ~20-30 minutos

## Configurar el despliegue

<Steps>
  <Step title="Iniciar sesión en Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    La extensión `ssh` es necesaria para el túnel SSH nativo de Azure Bastion.

  </Step>

  <Step title="Registrar los proveedores de recursos necesarios (una sola vez)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifica el registro. Espera hasta que ambos muestren `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Establecer variables de despliegue">
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

    Ajusta los nombres y rangos CIDR según tu entorno. La subred de Bastion debe ser al menos `/26`.

  </Step>

  <Step title="Seleccionar la clave SSH">
    Usa tu clave pública existente si ya tienes una:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Si aún no tienes una clave SSH, genera una:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Seleccionar el tamaño de la VM y el tamaño del disco del SO">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Elige un tamaño de VM y un tamaño de disco del SO disponibles en tu suscripción y región:

    - Empieza con algo pequeño para uso ligero y escala más tarde
    - Usa más vCPU/RAM/disco para automatización más intensa, más canales o cargas de trabajo mayores de modelos/herramientas
    - Si un tamaño de VM no está disponible en tu región o en la cuota de tu suscripción, elige el SKU disponible más cercano

    Lista los tamaños de VM disponibles en tu región objetivo:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Comprueba tu uso/cuota actual de vCPU y disco:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Desplegar recursos de Azure

<Steps>
  <Step title="Crear el grupo de recursos">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Crear el grupo de seguridad de red">
    Crea el NSG y agrega reglas para que solo la subred de Bastion pueda hacer SSH a la VM.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Permitir SSH solo desde la subred de Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Denegar SSH desde internet pública
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Denegar SSH desde otras fuentes de la VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Las reglas se evalúan por prioridad (número más bajo primero): el tráfico de Bastion se permite en 100, y luego todo el resto del SSH se bloquea en 110 y 120.

  </Step>

  <Step title="Crear la red virtual y las subredes">
    Crea la VNet con la subred de la VM (NSG adjunto) y luego agrega la subred de Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Adjuntar el NSG a la subred de la VM
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — Azure exige este nombre
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Crear la VM">
    La VM no tiene IP pública. El acceso SSH se realiza exclusivamente a través de Azure Bastion.

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

    `--public-ip-address ""` evita que se asigne una IP pública. `--nsg ""` omite la creación de un NSG por NIC (el NSG a nivel de subred gestiona la seguridad).

    **Reproducibilidad:** el comando anterior usa `latest` para la imagen de Ubuntu. Para fijar una versión específica, lista las versiones disponibles y reemplaza `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Crear Azure Bastion">
    Azure Bastion proporciona acceso SSH gestionado a la VM sin exponer una IP pública. Se requiere SKU Standard con tunneling para `az network bastion ssh` basado en CLI.

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

    El aprovisionamiento de Bastion suele tardar entre 5 y 10 minutos, pero en algunas regiones puede tardar hasta 15-30 minutos.

  </Step>
</Steps>

## Instalar OpenClaw

<Steps>
  <Step title="Entrar por SSH en la VM a través de Azure Bastion">
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

  <Step title="Instalar OpenClaw (en la shell de la VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    El instalador instala Node LTS y dependencias si aún no están presentes, instala OpenClaw y lanza el asistente de incorporación. Consulta [Install](/es/install) para más detalles.

  </Step>

  <Step title="Verificar Gateway">
    Después de completar la incorporación:

    ```bash
    openclaw gateway status
    ```

    La mayoría de los equipos empresariales de Azure ya tienen licencias de GitHub Copilot. Si ese es tu caso, recomendamos elegir el proveedor GitHub Copilot en el asistente de incorporación de OpenClaw. Consulta [GitHub Copilot provider](/es/providers/github-copilot).

  </Step>
</Steps>

## Consideraciones de costo

Azure Bastion Standard SKU cuesta aproximadamente **\$140/mes** y la VM (Standard_B2as_v2) cuesta aproximadamente **\$55/mes**.

Para reducir costos:

- **Desasigna la VM** cuando no esté en uso (detiene la facturación de cómputo; los cargos de disco permanecen). El Gateway de OpenClaw no estará accesible mientras la VM esté desasignada: reinícialo cuando necesites que vuelva a estar activo:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Elimina Bastion cuando no lo necesites** y vuelve a crearlo cuando necesites acceso SSH. Bastion es el mayor componente de costo y solo tarda unos minutos en aprovisionarse.
- **Usa el SKU Basic de Bastion** (~\$38/mes) si solo necesitas SSH basado en Portal y no requieres tunneling por CLI (`az network bastion ssh`).

## Limpieza

Para eliminar todos los recursos creados por esta guía:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Esto elimina el grupo de recursos y todo lo que contiene (VM, VNet, NSG, Bastion, IP pública).

## Siguientes pasos

- Configurar canales de mensajería: [Canales](/es/channels)
- Emparejar dispositivos locales como nodos: [Nodos](/es/nodes)
- Configurar Gateway: [Configuración de Gateway](/es/gateway/configuration)
- Para más detalles sobre el despliegue de OpenClaw en Azure con el proveedor de modelos GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Relacionado

- [Resumen de instalación](/es/install)
- [GCP](/es/install/gcp)
- [DigitalOcean](/es/install/digitalocean)
