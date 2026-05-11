---
read_when:
    - Vous souhaitez isoler OpenClaw de votre environnement macOS principal
    - Vous voulez intégrer iMessage dans un bac à sable
    - Vous voulez un environnement macOS réinitialisable que vous pouvez cloner
    - Vous souhaitez comparer les options de VM macOS locales et hébergées
summary: Exécutez OpenClaw dans une VM macOS en bac à sable (locale ou hébergée) lorsque vous avez besoin d’isolation ou d’iMessage
title: Machines virtuelles macOS
x-i18n:
    generated_at: "2026-05-11T20:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## Configuration par défaut recommandée (la plupart des utilisateurs)

- **Petit VPS Linux** pour un Gateway toujours actif et à faible coût. Voir [Hébergement VPS](/fr/vps).
- **Matériel dédié** (Mac mini ou machine Linux) si vous voulez un contrôle total et une **IP résidentielle** pour l’automatisation du navigateur. De nombreux sites bloquent les IP de centres de données, donc la navigation locale fonctionne souvent mieux.
- **Hybride :** gardez le Gateway sur un VPS bon marché, et connectez votre Mac comme **Node** lorsque vous avez besoin d’automatisation navigateur/UI. Voir [Nodes](/fr/nodes) et [Gateway distant](/fr/gateway/remote).

Utilisez une VM macOS lorsque vous avez spécifiquement besoin de fonctionnalités propres à macOS, comme iMessage, ou que vous voulez une isolation stricte de votre Mac quotidien.

## Options de VM macOS

### VM locale sur votre Mac Apple Silicon (Lume)

Exécutez OpenClaw dans une VM macOS en bac à sable sur votre Mac Apple Silicon existant avec [Lume](https://cua.ai/docs/lume).

Cela vous donne :

- Environnement macOS complet en isolation (votre hôte reste propre)
- Prise en charge d’iMessage via `imsg` (le chemin local par défaut est impossible sous Linux/Windows)
- Réinitialisation instantanée en clonant des VM
- Aucun matériel supplémentaire ni coût cloud

### Fournisseurs de Mac hébergés (cloud)

Si vous voulez macOS dans le cloud, les fournisseurs de Mac hébergés fonctionnent aussi :

- [MacStadium](https://www.macstadium.com/) (Mac hébergés)
- D’autres fournisseurs de Mac hébergés fonctionnent également ; suivez leur documentation VM + SSH

Une fois que vous avez un accès SSH à une VM macOS, passez à l’étape 6 ci-dessous.

---

## Parcours rapide (Lume, utilisateurs expérimentés)

1. Installez Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Terminez l’Assistant réglages, activez la Connexion à distance (SSH)
4. `lume run openclaw --no-display`
5. Connectez-vous en SSH, installez OpenClaw, configurez les canaux
6. Terminé

---

## Ce dont vous avez besoin (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou version ultérieure sur l’hôte
- Environ 60 Go d’espace disque libre par VM
- Environ 20 minutes

---

## 1) Installer Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Si `~/.local/bin` n’est pas dans votre PATH :

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Vérifiez :

```bash
lume --version
```

Docs : [Installation de Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Créer la VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Cela télécharge macOS et crée la VM. Une fenêtre VNC s’ouvre automatiquement.

<Note>
Le téléchargement peut prendre un certain temps selon votre connexion.
</Note>

---

## 3) Terminer l’Assistant réglages

Dans la fenêtre VNC :

1. Sélectionnez la langue et la région
2. Ignorez l’identifiant Apple (ou connectez-vous si vous voulez utiliser iMessage plus tard)
3. Créez un compte utilisateur (retenez le nom d’utilisateur et le mot de passe)
4. Ignorez toutes les fonctionnalités facultatives

Une fois la configuration terminée, activez SSH :

1. Ouvrez Réglages Système → Général → Partage
2. Activez « Connexion à distance »

---

## 4) Obtenir l’adresse IP de la VM

```bash
lume get openclaw
```

Cherchez l’adresse IP (généralement `192.168.64.x`).

---

## 5) Se connecter à la VM en SSH

```bash
ssh youruser@192.168.64.X
```

Remplacez `youruser` par le compte que vous avez créé, et l’IP par l’IP de votre VM.

---

## 6) Installer OpenClaw

Dans la VM :

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Suivez les invites d’intégration pour configurer votre fournisseur de modèle (Anthropic, OpenAI, etc.).

---

## 7) Configurer les canaux

Modifiez le fichier de configuration :

```bash
nano ~/.openclaw/openclaw.json
```

Ajoutez vos canaux :

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Connectez-vous ensuite à WhatsApp (scannez le QR) :

```bash
openclaw channels login
```

---

## 8) Exécuter la VM sans interface graphique

Arrêtez la VM et redémarrez-la sans affichage :

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM s’exécute en arrière-plan. Le daemon d’OpenClaw maintient le gateway en fonctionnement.

Pour vérifier l’état :

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus : intégration iMessage

C’est la fonctionnalité phare de l’exécution sur macOS. Utilisez [iMessage](/fr/channels/imessage) avec `imsg` pour ajouter Messages à OpenClaw.

Dans la VM :

1. Connectez-vous à Messages.
2. Installez `imsg`.
3. Accordez l’accès complet au disque et l’autorisation d’automatisation au processus exécutant OpenClaw/`imsg`.
4. Vérifiez la prise en charge RPC avec `imsg rpc --help`.

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

Redémarrez le gateway. Votre agent peut désormais envoyer et recevoir des iMessages.

Détails complets de configuration : [canal iMessage](/fr/channels/imessage)

---

## Enregistrer une image de référence

Avant de personnaliser davantage, prenez un instantané de votre état propre :

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

---

## Fonctionnement 24/7

Gardez la VM en fonctionnement en :

- Gardant votre Mac branché
- Désactivant la veille dans Réglages Système → Économiseur d’énergie
- Utilisant `caffeinate` si nécessaire

Pour un vrai fonctionnement toujours actif, envisagez un Mac mini dédié ou un petit VPS. Voir [Hébergement VPS](/fr/vps).

---

## Dépannage

| Problème                  | Solution                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Connexion SSH à la VM impossible | Vérifiez que « Connexion à distance » est activée dans les Réglages Système de la VM |
| IP de la VM non affichée | Attendez que la VM démarre complètement, puis relancez `lume get openclaw`          |
| Commande Lume introuvable | Ajoutez `~/.local/bin` à votre PATH                                                |
| QR WhatsApp non scanné | Assurez-vous d’être connecté à la VM (et non à l’hôte) lorsque vous exécutez `openclaw channels login` |

---

## Docs associées

- [Hébergement VPS](/fr/vps)
- [Nodes](/fr/nodes)
- [Gateway distant](/fr/gateway/remote)
- [canal iMessage](/fr/channels/imessage)
- [Démarrage rapide de Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Référence CLI de Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuration de VM sans surveillance](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avancé)
- [Sandboxing Docker](/fr/install/docker) (approche d’isolation alternative)
