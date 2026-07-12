---
read_when:
    - Vous souhaitez isoler OpenClaw de votre environnement macOS principal
    - Vous souhaitez intégrer iMessage dans un bac à sable
    - Vous souhaitez disposer d’un environnement macOS réinitialisable que vous pouvez cloner
    - Vous souhaitez comparer les options de machines virtuelles macOS locales et hébergées
summary: Exécutez OpenClaw dans une machine virtuelle macOS isolée (locale ou hébergée) lorsque vous avez besoin d’isolation ou d’iMessage
title: Machines virtuelles macOS
x-i18n:
    generated_at: "2026-07-12T02:45:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Configuration recommandée par défaut (pour la plupart des utilisateurs)

- **Petit VPS Linux** pour un Gateway toujours actif à faible coût. Consultez [Hébergement sur VPS](/fr/vps).
- **Matériel dédié** (Mac mini ou machine Linux) si vous souhaitez un contrôle total et une **adresse IP résidentielle** pour l’automatisation du navigateur. De nombreux sites bloquent les adresses IP des centres de données ; la navigation locale fonctionne donc souvent mieux.
- **Hybride** : conservez le Gateway sur un VPS bon marché et connectez votre Mac comme **nœud** lorsque vous avez besoin d’automatiser un navigateur ou une interface utilisateur. Consultez [Nœuds](/fr/nodes) et [Gateway distant](/fr/gateway/remote).

Utilisez une VM macOS uniquement si vous avez spécifiquement besoin de fonctionnalités propres à macOS, comme iMessage, ou si vous souhaitez une isolation stricte par rapport à votre Mac utilisé au quotidien.

## Options de VM macOS

### VM locale sur votre Mac Apple Silicon (Lume)

Exécutez OpenClaw dans une VM macOS isolée sur votre Mac Apple Silicon existant à l’aide de [Lume](https://cua.ai/docs/lume). Vous bénéficiez ainsi des avantages suivants :

- Environnement macOS complet et isolé (votre système hôte reste propre)
- Prise en charge d’iMessage via `imsg` ; le chemin local par défaut est impossible sous Linux/Windows
- Réinitialisation instantanée par clonage des VM
- Aucun coût supplémentaire de matériel ou de cloud

### Fournisseurs de Mac hébergés (cloud)

Si vous souhaitez utiliser macOS dans le cloud, les fournisseurs de Mac hébergés conviennent également :

- [MacStadium](https://www.macstadium.com/) (Mac hébergés)
- D’autres fournisseurs de Mac hébergés conviennent également ; suivez leur documentation relative aux VM et à SSH

Une fois l’accès SSH à une VM macOS obtenu, poursuivez avec [Installer OpenClaw](#6-install-openclaw) ci-dessous.

## Parcours rapide (Lume, utilisateurs expérimentés)

1. Installez Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Terminez l’Assistant réglages et activez Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Connectez-vous par SSH, installez OpenClaw et configurez les canaux.
6. Terminé.

## Prérequis (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou version ultérieure sur l’hôte
- Environ 60 Go d’espace disque libre par VM
- Environ 20 minutes

## 1) Installer Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Si `~/.local/bin` ne figure pas dans votre PATH :

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Vérifiez :

```bash
lume --version
```

Documentation : [Installation de Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) Créer la VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Cette commande télécharge macOS et crée la VM. Une fenêtre VNC s’ouvre automatiquement.

<Note>
Le téléchargement peut prendre un certain temps selon votre connexion.
</Note>

## 3) Terminer l’Assistant réglages

Dans la fenêtre VNC :

1. Sélectionnez la langue et la région.
2. Ignorez l’identifiant Apple (ou connectez-vous si vous souhaitez utiliser iMessage ultérieurement).
3. Créez un compte utilisateur (mémorisez le nom d’utilisateur et le mot de passe).
4. Ignorez toutes les fonctionnalités facultatives.

Une fois la configuration terminée :

1. Activez SSH : System Settings -> General -> Sharing, puis activez "Remote Login".
2. Pour utiliser la VM sans affichage, activez la connexion automatique : System Settings -> Users & Groups, sélectionnez "Automatically log in as:", puis choisissez l’utilisateur de la VM.

## 4) Obtenir l’adresse IP de la VM

```bash
lume get openclaw
```

Repérez l’adresse IP (généralement `192.168.64.x`).

## 5) Se connecter à la VM par SSH

```bash
ssh youruser@192.168.64.X
```

Remplacez `youruser` par le compte que vous avez créé et l’adresse IP par celle de votre VM.

## 6) Installer OpenClaw

Dans la VM :

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Suivez les invites de prise en main pour configurer votre fournisseur de modèle (Anthropic, OpenAI, etc.).

## 7) Configurer les canaux

Modifiez le fichier de configuration :

```bash
nano ~/.openclaw/openclaw.json
```

Ajoutez vos canaux :

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Connectez-vous ensuite à WhatsApp (scannez le code QR) :

```bash
openclaw channels login
```

## 8) Exécuter la VM sans affichage

Arrêtez la VM, puis redémarrez-la sans affichage :

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM s’exécute en arrière-plan ; le démon d’OpenClaw maintient le Gateway en fonctionnement. Pour vérifier l’état :

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Bonus : intégration d’iMessage

C’est la fonctionnalité phare de l’exécution sous macOS. Utilisez [iMessage](/fr/channels/imessage) avec `imsg` pour ajouter Messages à OpenClaw.

Dans la VM :

1. Connectez-vous à Messages.
2. Installez `imsg`.
3. Accordez les autorisations Full Disk Access et Automation au processus qui exécute OpenClaw/`imsg`.
4. Vérifiez la prise en charge de RPC avec `imsg rpc --help`.

Ajoutez ceci à votre configuration OpenClaw :

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Redémarrez le Gateway. Votre agent peut désormais envoyer et recevoir des iMessages. Détails complets de la configuration : [Canal iMessage](/fr/channels/imessage).

## Enregistrer une image de référence

Avant de poursuivre la personnalisation, créez un instantané de votre état propre :

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Réinitialisez à tout moment :

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## Fonctionnement 24 h/24 et 7 j/7

Maintenez la VM en fonctionnement en :

- Laissant votre Mac branché
- Désactivant la mise en veille dans System Settings -> Energy Saver
- Utilisant `caffeinate` si nécessaire

Pour un fonctionnement réellement continu, envisagez un Mac mini dédié ou un petit VPS. Consultez [Hébergement sur VPS](/fr/vps).

## Dépannage

| Problème                                | Solution                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Connexion SSH à la VM impossible        | Vérifiez que "Remote Login" est activé dans les System Settings de la VM                                            |
| L’adresse IP de la VM ne s’affiche pas  | Attendez que la VM ait complètement démarré, puis exécutez à nouveau `lume get openclaw`                            |
| Commande Lume introuvable               | Ajoutez `~/.local/bin` à votre PATH                                                                                 |
| Le code QR WhatsApp ne peut être scanné | Vérifiez que vous êtes connecté à la VM, et non à l’hôte, lorsque vous exécutez `openclaw channels login`           |

## Documentation associée

- [Hébergement sur VPS](/fr/vps)
- [Nœuds](/fr/nodes)
- [Gateway distant](/fr/gateway/remote)
- [Canal iMessage](/fr/channels/imessage)
- [Démarrage rapide avec Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Référence de la CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuration automatisée d’une VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avancé)
- [Isolation avec Docker](/fr/install/docker) (autre approche d’isolation)
