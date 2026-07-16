---
read_when:
    - Première configuration à partir de zéro
    - Vous recherchez le moyen le plus rapide d’obtenir une messagerie fonctionnelle
summary: Installez OpenClaw et lancez votre première conversation en quelques minutes.
title: Prise en main
x-i18n:
    generated_at: "2026-07-16T13:50:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Installez OpenClaw, effectuez l’intégration et échangez avec votre assistant IA en environ 5
minutes. À la fin, vous disposerez d’un Gateway opérationnel, d’une authentification configurée et d’une
session de discussion fonctionnelle.

## Prérequis

- **Node.js 22.22.3+, 24.15+ ou 25.9+** (24 est la version recommandée par défaut)
- **Une clé API** d’un fournisseur de modèles (Anthropic, OpenAI, Google, etc.) — elle vous sera demandée lors de l’intégration

<Tip>
Vérifiez votre version de Node avec `node --version`.
**Utilisateurs de Windows :** l’application de bureau native Windows Hub constitue la solution la plus simple. Le
programme d’installation PowerShell et les configurations Gateway sous WSL2 sont également pris en charge. Consultez [Windows](/fr/platforms/windows).
Vous devez installer Node ? Consultez [Installation de Node](/fr/install/node).
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
    étapes facultatives et revenez-y ultérieurement avec `openclaw configure`.

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

    Cette commande ouvre l’interface de contrôle dans votre navigateur. Si elle se charge, tout fonctionne.

  </Step>
  <Step title="Envoyer votre premier message">
    Saisissez un message dans la discussion de l’interface de contrôle ; vous devriez recevoir une réponse de l’IA.

    Vous préférez discuter depuis votre téléphone ? Le canal le plus rapide à configurer est
    [Telegram](/fr/channels/telegram) (un simple jeton de bot). Consultez [Canaux](/fr/channels)
    pour découvrir toutes les options.

  </Step>
</Steps>

<Accordion title="Avancé : monter une version personnalisée de l’interface de contrôle">
  Si vous gérez une version localisée ou personnalisée du tableau de bord, faites pointer
  `gateway.controlUi.root` vers un répertoire contenant vos ressources statiques
  compilées et `index.html`.

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
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, et plus encore.
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

- `OPENCLAW_HOME` — répertoire personnel pour la résolution des chemins internes
- `OPENCLAW_STATE_DIR` — remplace le répertoire d’état
- `OPENCLAW_CONFIG_PATH` — remplace le chemin du fichier de configuration

Documentation complète : [Variables d’environnement](/fr/help/environment).
</Accordion>

## Voir aussi

- [Présentation de l’installation](/fr/install)
- [Présentation des canaux](/fr/channels)
- [Configuration](/fr/start/setup)
