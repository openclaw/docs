---
read_when:
    - Sie möchten OpenClaw rund um die Uhr auf Azure mit gehärteter Network Security Group betreiben
    - Sie möchten ein produktionsreifes, dauerhaft verfügbares OpenClaw Gateway auf Ihrer eigenen Azure-Linux-VM.
    - Sie möchten eine sichere Administration mit Azure Bastion SSH durchführen
summary: OpenClaw Gateway rund um die Uhr auf einer Azure-Linux-VM mit persistentem Zustand ausführen
title: Azure
x-i18n:
    generated_at: "2026-07-12T15:32:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Richten Sie mit der Azure CLI eine Azure-Linux-VM ein, härten Sie die Netzwerksicherheitsgruppe (NSG), konfigurieren Sie Azure Bastion für den SSH-Zugriff und installieren Sie OpenClaw.

## Was Sie tun werden

- Azure-Netzwerk- (VNet, Subnetze, NSG) und Computeressourcen mit der Azure CLI erstellen
- NSG-Regeln anwenden, sodass SSH-Zugriff auf die VM nur über Azure Bastion zulässig ist
- Azure Bastion für den SSH-Zugriff verwenden (keine öffentliche IP-Adresse für die VM)
- OpenClaw mit dem Installationsskript installieren
- Das Gateway überprüfen

## Was Sie benötigen

- Ein Azure-Abonnement mit der Berechtigung, Computer- und Netzwerkressourcen zu erstellen
- Installierte Azure CLI (siehe [Installationsschritte für die Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Ein SSH-Schlüsselpaar (diese Anleitung beschreibt bei Bedarf dessen Erstellung)
- Etwa 20–30 Minuten

## Bereitstellung konfigurieren

<Steps>
  <Step title="Bei der Azure CLI anmelden">
    ```bash
    az login
    az extension add -n ssh
    ```

    Die Erweiterung `ssh` ist für natives SSH-Tunneling über Azure Bastion erforderlich.

  </Step>

  <Step title="Erforderliche Ressourcenanbieter registrieren (einmalig)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Überprüfen Sie die Registrierung und warten Sie, bis für beide `Registered` angezeigt wird.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Bereitstellungsvariablen festlegen">
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

    Passen Sie Namen und CIDR-Bereiche an Ihre Umgebung an. Das Bastion-Subnetz muss mindestens `/26` groß sein.

  </Step>

  <Step title="SSH-Schlüssel auswählen">
    Verwenden Sie Ihren vorhandenen öffentlichen Schlüssel, falls Sie einen haben:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Andernfalls erstellen Sie einen:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM-Größe und Größe des Betriebssystemdatenträgers auswählen">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Beginnen Sie bei geringer Nutzung mit einer kleineren Größe und skalieren Sie später hoch.
    - Verwenden Sie für umfangreichere Automatisierung, mehr Kanäle oder größere Modell- und Tool-Arbeitslasten mehr vCPU, RAM und Speicherplatz.
    - Wenn eine Größe in Ihrer Region oder innerhalb Ihres Abonnementkontingents nicht verfügbar ist, wählen Sie die ähnlichste verfügbare SKU.

    Listen Sie die in Ihrer Zielregion verfügbaren VM-Größen auf:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Prüfen Sie Ihre aktuelle vCPU- und Datenträgernutzung sowie die entsprechenden Kontingente:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure-Ressourcen bereitstellen

<Steps>
  <Step title="Ressourcengruppe erstellen">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Netzwerksicherheitsgruppe erstellen">
    Erstellen Sie die NSG und fügen Sie Regeln hinzu, sodass nur das Bastion-Subnetz per SSH auf die VM zugreifen kann.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # SSH nur aus dem Bastion-Subnetz zulassen
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # SSH aus dem öffentlichen Internet verweigern
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # SSH aus anderen VNet-Quellen verweigern
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Regeln werden nach Priorität ausgewertet, beginnend mit der niedrigsten Zahl: Bastion-Datenverkehr wird mit 100 zugelassen, anschließend wird sämtlicher anderer SSH-Datenverkehr mit 110 und 120 blockiert.

  </Step>

  <Step title="Virtuelles Netzwerk und Subnetze erstellen">
    Erstellen Sie das VNet mit dem VM-Subnetz (mit zugeordneter NSG) und fügen Sie anschließend das Bastion-Subnetz hinzu.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # NSG dem VM-Subnetz zuordnen
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: Dieser exakte Name wird von Azure vorausgesetzt
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VM erstellen">
    Die VM erhält keine öffentliche IP-Adresse. Der SSH-Zugriff erfolgt ausschließlich über Azure Bastion.

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

    `--public-ip-address ""` verhindert die Zuweisung einer öffentlichen IP-Adresse. `--nsg ""` überspringt eine NSG pro Netzwerkschnittstelle, da die NSG auf Subnetzebene bereits für die Sicherheit zuständig ist.

    Um statt `latest` eine bestimmte Ubuntu-Image-Version festzulegen, listen Sie zunächst die verfügbaren Versionen auf:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion erstellen">
    Azure Bastion ermöglicht verwalteten SSH-Zugriff, ohne eine öffentliche IP-Adresse auf der VM offenzulegen. Für CLI-basiertes `az network bastion ssh` ist die Standard-SKU mit aktiviertem Tunneling erforderlich.

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

    Die Bereitstellung von Bastion dauert in der Regel 5–10 Minuten, kann in einigen Regionen jedoch bis zu 15–30 Minuten dauern.

  </Step>
</Steps>

## OpenClaw installieren

<Steps>
  <Step title="Über Azure Bastion per SSH mit der VM verbinden">
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

  <Step title="OpenClaw installieren (in der VM-Shell)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Das Installationsprogramm installiert Node und die Abhängigkeiten, sofern diese noch nicht vorhanden sind, installiert OpenClaw und startet das Onboarding. Weitere Informationen finden Sie unter [Installation](/de/install).

  </Step>

  <Step title="Gateway überprüfen">
    Nach Abschluss des Onboardings:

    ```bash
    openclaw gateway status
    ```

    Wenn Ihre Organisation bereits über GitHub-Copilot-Lizenzen verfügt, können Sie während des Onboardings den GitHub-Copilot-Provider anstelle eines separaten Modell-API-Schlüssels auswählen. Siehe [GitHub-Copilot-Provider](/de/providers/github-copilot).

  </Step>
</Steps>

## Kostenüberlegungen

Ungefähre monatliche Kosten (überprüfen Sie die aktuellen Preise im Azure-Preisrechner, da die Preise je nach Region variieren und sich im Laufe der Zeit ändern):

- Azure Bastion Standard-SKU: ungefähr 140 USD/Monat
- VM (`Standard_B2as_v2`): ungefähr 55 USD/Monat

So senken Sie die Kosten:

- Heben Sie die Zuordnung der VM auf, wenn sie nicht verwendet wird. Dadurch endet die Abrechnung der Computeressourcen (Datenträgerkosten fallen weiterhin an). Das Gateway ist nicht erreichbar, solange die Zuordnung aufgehoben ist.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # später neu starten
  ```

- Löschen Sie Bastion, wenn es nicht benötigt wird, und erstellen Sie es erneut, wenn Sie wieder SSH-Zugriff benötigen. Es ist der größte Kostenfaktor und wird innerhalb weniger Minuten bereitgestellt.
- Verwenden Sie die Bastion Basic-SKU (ungefähr 38 USD/Monat), wenn Sie nur Portal-basierten SSH-Zugriff und kein CLI-Tunneling (`az network bastion ssh`) benötigen.

## Bereinigung

Löschen Sie alle mit dieser Anleitung erstellten Ressourcen:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Dadurch werden die Ressourcengruppe und alle darin enthaltenen Ressourcen entfernt (VM, VNet, NSG, Bastion, öffentliche IP-Adresse).

## Nächste Schritte

- Nachrichtenkanäle einrichten: [Kanäle](/de/channels)
- Lokale Geräte als Nodes koppeln: [Nodes](/de/nodes)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- Weitere Einzelheiten zur Azure-Bereitstellung mit dem GitHub-Copilot-Modell-Provider: [OpenClaw auf Azure mit GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [GCP](/de/install/gcp)
- [DigitalOcean](/de/install/digitalocean)
