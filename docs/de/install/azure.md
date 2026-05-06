---
read_when:
    - Sie möchten OpenClaw rund um die Uhr auf Azure mit Härtung durch Netzwerksicherheitsgruppen betreiben
    - Sie möchten ein produktionsreifes, dauerhaft verfügbares OpenClaw Gateway auf Ihrer eigenen Azure Linux-VM
    - Sie möchten eine sichere Administration mit Azure Bastion SSH
summary: OpenClaw Gateway rund um die Uhr auf einer Azure-Linux-VM mit dauerhaftem Zustand ausführen
title: Azure
x-i18n:
    generated_at: "2026-05-06T06:52:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ab1b7d09dd66c495983aebd4766ce760d659cc6f362bbcd999d1c1345ae38f7
    source_path: install/azure.md
    workflow: 16
---

Dieser Leitfaden richtet eine Azure-Linux-VM mit der Azure CLI ein, wendet Härtungen für Network Security Groups (NSG) an, konfiguriert Azure Bastion für SSH-Zugriff und installiert OpenClaw.

## Was Sie tun werden

- Azure-Netzwerkressourcen (VNet, Subnetze, NSG) und Compute-Ressourcen mit der Azure CLI erstellen
- Network-Security-Group-Regeln anwenden, sodass VM-SSH nur über Azure Bastion erlaubt ist
- Azure Bastion für SSH-Zugriff verwenden (keine öffentliche IP auf der VM)
- OpenClaw mit dem Installationsskript installieren
- Das Gateway überprüfen

## Was Sie benötigen

- Ein Azure-Abonnement mit Berechtigung zum Erstellen von Compute- und Netzwerkressourcen
- Installierte Azure CLI (siehe bei Bedarf [Installationsschritte für die Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Ein SSH-Schlüsselpaar (der Leitfaden beschreibt bei Bedarf, wie Sie eines erzeugen)
- ~20-30 Minuten

## Bereitstellung konfigurieren

<Steps>
  <Step title="Bei der Azure CLI anmelden">
    ```bash
    az login
    az extension add -n ssh
    ```

    Die Erweiterung `ssh` ist für natives SSH-Tunneling über Azure Bastion erforderlich.

  </Step>

  <Step title="Erforderliche Ressourcen-Provider registrieren (einmalig)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Überprüfen Sie die Registrierung. Warten Sie, bis beide `Registered` anzeigen.

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

    Wenn Sie noch keinen SSH-Schlüssel haben, erzeugen Sie einen:

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

    Wählen Sie eine VM-Größe und eine Größe für den Betriebssystemdatenträger, die in Ihrem Abonnement und Ihrer Region verfügbar sind:

    - Für geringe Nutzung kleiner beginnen und später skalieren
    - Für umfangreichere Automatisierung, mehr Kanäle oder größere Modell-/Tool-Workloads mehr vCPU/RAM/Datenträger verwenden
    - Wenn eine VM-Größe in Ihrer Region oder Ihrem Abonnementkontingent nicht verfügbar ist, wählen Sie die nächstgelegene verfügbare SKU

    Verfügbare VM-Größen in Ihrer Zielregion auflisten:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Aktuelle vCPU- und Datenträgernutzung sowie Kontingente prüfen:

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

  <Step title="Network Security Group erstellen">
    Erstellen Sie die NSG und fügen Sie Regeln hinzu, sodass nur das Bastion-Subnetz per SSH auf die VM zugreifen kann.

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

    Die Regeln werden nach Priorität ausgewertet (niedrigste Zahl zuerst): Bastion-Datenverkehr ist mit 100 erlaubt, danach wird jeder andere SSH-Zugriff mit 110 und 120 blockiert.

  </Step>

  <Step title="Virtuelles Netzwerk und Subnetze erstellen">
    Erstellen Sie das VNet mit dem VM-Subnetz (angehängte NSG) und fügen Sie anschließend das Bastion-Subnetz hinzu.

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

  <Step title="VM erstellen">
    Die VM hat keine öffentliche IP. SSH-Zugriff erfolgt ausschließlich über Azure Bastion.

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

    `--public-ip-address ""` verhindert, dass eine öffentliche IP zugewiesen wird. `--nsg ""` überspringt das Erstellen einer NSG pro NIC (die NSG auf Subnetzebene übernimmt die Sicherheit).

    **Reproduzierbarkeit:** Der obige Befehl verwendet `latest` für das Ubuntu-Image. Um eine bestimmte Version festzulegen, listen Sie verfügbare Versionen auf und ersetzen Sie `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion erstellen">
    Azure Bastion stellt verwalteten SSH-Zugriff auf die VM bereit, ohne eine öffentliche IP offenzulegen. Für CLI-basiertes `az network bastion ssh` ist die Standard-SKU mit Tunneling erforderlich.

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

    Die Bereitstellung von Bastion dauert typischerweise 5-10 Minuten, kann in manchen Regionen aber bis zu 15-30 Minuten dauern.

  </Step>
</Steps>

## OpenClaw installieren

<Steps>
  <Step title="Per SSH über Azure Bastion mit der VM verbinden">
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

    Das Installationsprogramm installiert Node LTS und Abhängigkeiten, falls sie noch nicht vorhanden sind, installiert OpenClaw und startet den Onboarding-Assistenten. Weitere Details finden Sie unter [Installation](/de/install).

  </Step>

  <Step title="Gateway überprüfen">
    Nach Abschluss des Onboardings:

    ```bash
    openclaw gateway status
    ```

    Die meisten Enterprise-Azure-Teams haben bereits GitHub-Copilot-Lizenzen. Wenn das bei Ihnen der Fall ist, empfehlen wir, im OpenClaw-Onboarding-Assistenten den GitHub-Copilot-Provider auszuwählen. Siehe [GitHub-Copilot-Provider](/de/providers/github-copilot).

  </Step>
</Steps>

## Kostenüberlegungen

Azure Bastion Standard SKU kostet ungefähr **\$140/Monat**, und die VM (Standard_B2as_v2) kostet ungefähr **\$55/Monat**.

So senken Sie Kosten:

- **Geben Sie die VM frei**, wenn sie nicht verwendet wird (stoppt die Compute-Abrechnung; Datenträgerkosten bleiben bestehen). Das OpenClaw Gateway ist nicht erreichbar, während die VM freigegeben ist — starten Sie es neu, wenn Sie es wieder live benötigen:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Löschen Sie Bastion, wenn es nicht benötigt wird**, und erstellen Sie es neu, wenn Sie SSH-Zugriff benötigen. Bastion ist die größte Kostenkomponente und benötigt nur wenige Minuten für die Bereitstellung.
- **Verwenden Sie die Basic-Bastion-SKU** (~\$38/Monat), wenn Sie nur Portal-basiertes SSH benötigen und kein CLI-Tunneling (`az network bastion ssh`) brauchen.

## Bereinigung

So löschen Sie alle durch diesen Leitfaden erstellten Ressourcen:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Dadurch werden die Ressourcengruppe und alles darin entfernt (VM, VNet, NSG, Bastion, öffentliche IP).

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/de/channels)
- Lokale Geräte als Nodes koppeln: [Nodes](/de/nodes)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- Weitere Details zur OpenClaw-Azure-Bereitstellung mit dem GitHub-Copilot-Modell-Provider: [OpenClaw auf Azure mit GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Verwandt

- [Installationsübersicht](/de/install)
- [GCP](/de/install/gcp)
- [DigitalOcean](/de/install/digitalocean)
