---
read_when:
    - Première configuration à partir de zéro
    - Vous souhaitez la méthode la plus rapide pour disposer d’un chat fonctionnel
summary: Installez OpenClaw et lancez votre première conversation en quelques minutes.
title: Prise en main
x-i18n:
    generated_at: "2026-07-12T03:20:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Installez OpenClaw, effectuez l’intégration et échangez avec votre assistant IA en environ 5
minutes. À la fin, vous disposerez d’un Gateway opérationnel, d’une authentification configurée et d’une
session de discussion fonctionnelle.

## Prérequis

- **Node.js 22.19+, 23.11+ ou 24+** (la version 24 est recommandée par défaut)
- **Une clé API** fournie par un fournisseur de modèles (Anthropic, OpenAI, Google, etc.) — l’assistant d’intégration vous la demandera

<Tip>
Vérifiez votre version de Node avec `node --version`.
**Utilisateurs de Windows :** l’application Windows Hub native constitue la solution la plus simple sur ordinateur. Le
programme d’installation PowerShell et les configurations du Gateway sous WSL2 sont également pris en charge. Consultez [Windows](/fr/platforms/windows).
Vous devez installer Node ? Consultez [Configuration de Node](/fr/install/node).
</Tip>

## Configuration rapide

<Steps>
  <Step title="Installer OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Processus du script d’installation"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Autres méthodes d’installation (Docker, Nix, npm) : [Installation](/fr/install).
    </Note>

  </Step>
  <Step title="Effectuer l’intégration">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide dans le choix d’un fournisseur de modèles, la définition d’une clé API
    et la configuration du Gateway. Le démarrage rapide ne prend généralement que quelques minutes, mais
    la connexion au fournisseur, l’association d’un canal, l’installation du démon, les téléchargements réseau, les Skills
    ou les plugins facultatifs peuvent prolonger l’intégration complète. Ignorez les
    étapes facultatives et revenez-y plus tard avec `openclaw configure`.

    Consultez [Intégration (CLI)](/fr/start/wizard) pour la documentation de référence complète.

  </Step>
  <Step title="Vérifier que le Gateway fonctionne">
    ```bash
    openclaw gateway status
    ```

    Le Gateway devrait être à l’écoute sur le port 18789.

  </Step>
  <Step title="Ouvrir le tableau de bord">
    ```bash
    openclaw dashboard
    ```

    Cette commande ouvre l’interface de contrôle dans votre navigateur. Si elle se charge, tout fonctionne correctement.

  </Step>
  <Step title="Envoyer votre premier message">
    Saisissez un message dans la discussion de l’interface de contrôle ; vous devriez recevoir une réponse de l’IA.

    Vous préférez discuter depuis votre téléphone ? Le canal le plus rapide à configurer est
    [Telegram](/fr/channels/telegram) (un simple jeton de bot suffit). Consultez [Canaux](/fr/channels)
    pour découvrir toutes les options.

  </Step>
</Steps>

<Accordion title="Avancé : monter une version personnalisée de l’interface de contrôle">
  Si vous gérez une version localisée ou personnalisée du tableau de bord, définissez
  `gateway.controlUi.root` sur un répertoire contenant vos ressources statiques
  compilées et le fichier `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copiez vos fichiers statiques compilés dans ce répertoire.
```

Définissez ensuite :

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Redémarrez le Gateway et rouvrez le tableau de bord :

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Étapes suivantes

<Columns>
  <Card title="Connecter un canal" href="/fr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo et bien d’autres.
  </Card>
  <Card title="Association et sécurité" href="/fr/channels/pairing" icon="shield">
    Contrôlez qui peut envoyer des messages à votre agent.
  </Card>
  <Card title="Configurer le Gateway" href="/fr/gateway/configuration" icon="settings">
    Modèles, outils, bac à sable et paramètres avancés.
  </Card>
  <Card title="Parcourir les outils" href="/fr/tools" icon="wrench">
    Navigateur, exécution, recherche sur le Web, Skills et plugins.
  </Card>
</Columns>

<Accordion title="Avancé : variables d’environnement">
  Si vous exécutez OpenClaw avec un compte de service ou souhaitez utiliser des chemins personnalisés :

- `OPENCLAW_HOME` — répertoire personnel utilisé pour la résolution des chemins internes
- `OPENCLAW_STATE_DIR` — remplace le répertoire d’état
- `OPENCLAW_CONFIG_PATH` — remplace le chemin du fichier de configuration

Documentation de référence complète : [Variables d’environnement](/fr/help/environment).
</Accordion>

## Ressources associées

- [Vue d’ensemble de l’installation](/fr/install)
- [Vue d’ensemble des canaux](/fr/channels)
- [Configuration](/fr/start/setup)
