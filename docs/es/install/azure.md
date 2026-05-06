---
read_when:
    - Quieres ejecutar OpenClaw 24/7 en Azure con endurecimiento de Network Security Group
    - Quieres un OpenClaw Gateway de nivel de producción, siempre activo, en tu propia máquina virtual Linux de Azure
    - Desea una administración segura con SSH de Azure Bastion
summary: Ejecutar OpenClaw Gateway 24/7 en una VM Linux de Azure con estado persistente
title: Azure
x-i18n:
    generated_at: "2026-05-06T05:38:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ab1b7d09dd66c495983aebd4766ce760d659cc6f362bbcd999d1c1345ae38f7
    source_path: install/azure.md
    workflow: 16
---

Esta guía configura una VM de Linux de Azure con la CLI de Azure, aplica endurecimiento de Network Security Group (NSG), configura Azure Bastion para acceso SSH e instala OpenClaw.

## Qué harás

- Crear recursos de red de Azure (VNet, subredes, NSG) y recursos de cómputo con la CLI de Azure
- Aplicar reglas de Network Security Group para que el SSH de la VM solo se permita desde Azure Bastion
- Usar Azure Bastion para acceso SSH (sin IP pública en la VM)
- Instalar OpenClaw con el script de instalación
- Verificar el Gateway

## Qué necesitas

- Una suscripción de Azure con permiso para crear recursos de cómputo y red
- CLI de Azure instalada (consulta los [pasos de instalación de la CLI de Azure](https://learn.microsoft.com/cli/azure/install-azure-cli) si es necesario)
- Un par de claves SSH (la guía cubre cómo generar uno si es necesario)
- ~20-30 minutos

## Configurar la implementación

<Steps>
  <Step title="Iniciar sesión en la CLI de Azure">
    ```bash
    az login
    az extension add -n ssh
    ```

    La extensión `ssh` es necesaria para el túnel SSH nativo de Azure Bastion.

  </Step>

  <Step title="Registrar los proveedores de recursos necesarios (una vez)">
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

  <Step title="Establecer variables de implementación">
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

  <Step title="Seleccionar clave SSH">
    Usa tu clave pública existente si tienes una:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Si aún no tienes una clave SSH, genera una:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Seleccionar tamaño de VM y tamaño del disco del SO">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Elige un tamaño de VM y un tamaño de disco del SO disponibles en tu suscripción y región:

    - Comienza con algo más pequeño para uso ligero y escala más adelante
    - Usa más vCPU/RAM/disco para automatización más pesada, más canales o cargas de trabajo de modelos/herramientas más grandes
    - Si un tamaño de VM no está disponible en tu región o cuota de suscripción, elige el SKU disponible más cercano

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

    Las reglas se evalúan por prioridad (primero el número más bajo): el tráfico de Bastion se permite en 100 y luego todo el resto del SSH se bloquea en 110 y 120.

  </Step>

  <Step title="Crear la red virtual y las subredes">
    Crea la VNet con la subred de la VM (con el NSG asociado) y luego agrega la subred de Bastion.

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

  <Step title="Crear la VM">
    La VM no tiene IP pública. El acceso SSH se realiza exclusivamente mediante Azure Bastion.

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

    **Reproducibilidad:** El comando anterior usa `latest` para la imagen de Ubuntu. Para fijar una versión específica, lista las versiones disponibles y sustituye `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Crear Azure Bastion">
    Azure Bastion proporciona acceso SSH administrado a la VM sin exponer una IP pública. Se requiere el SKU Standard con tunelización para `az network bastion ssh` basado en CLI.

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

    El aprovisionamiento de Bastion suele tardar 5-10 minutos, pero puede tardar hasta 15-30 minutos en algunas regiones.

  </Step>
</Steps>

## Instalar OpenClaw

<Steps>
  <Step title="Conectarse por SSH a la VM mediante Azure Bastion">
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

    El instalador instala Node LTS y las dependencias si aún no están presentes, instala OpenClaw e inicia el asistente de incorporación. Consulta [Instalar](/es/install) para obtener más detalles.

  </Step>

  <Step title="Verificar el Gateway">
    Después de completar la incorporación:

    ```bash
    openclaw gateway status
    ```

    La mayoría de los equipos empresariales de Azure ya tienen licencias de GitHub Copilot. Si ese es tu caso, recomendamos elegir el proveedor GitHub Copilot en el asistente de incorporación de OpenClaw. Consulta [Proveedor GitHub Copilot](/es/providers/github-copilot).

  </Step>
</Steps>

## Consideraciones de costo

El SKU Standard de Azure Bastion cuesta aproximadamente **\$140/mes** y la VM (Standard_B2as_v2) cuesta aproximadamente **\$55/mes**.

Para reducir costos:

- **Desasigna la VM** cuando no esté en uso (detiene la facturación de cómputo; los cargos de disco permanecen). El Gateway de OpenClaw no estará accesible mientras la VM esté desasignada; reiníciala cuando necesites que vuelva a estar activa:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Elimina Bastion cuando no sea necesario** y recréalo cuando necesites acceso SSH. Bastion es el componente de mayor costo y tarda solo unos minutos en aprovisionarse.
- **Usa el SKU Basic de Bastion** (~\$38/mes) si solo necesitas SSH basado en el Portal y no requieres tunelización por CLI (`az network bastion ssh`).

## Limpieza

Para eliminar todos los recursos creados por esta guía:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Esto elimina el grupo de recursos y todo lo que contiene (VM, VNet, NSG, Bastion, IP pública).

## Pasos siguientes

- Configura canales de mensajería: [Canales](/es/channels)
- Empareja dispositivos locales como nodos: [Nodos](/es/nodes)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Para obtener más detalles sobre la implementación de OpenClaw en Azure con el proveedor de modelos GitHub Copilot: [OpenClaw en Azure con GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Relacionado

- [Resumen de instalación](/es/install)
- [GCP](/es/install/gcp)
- [DigitalOcean](/es/install/digitalocean)
