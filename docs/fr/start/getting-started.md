---
read_when:
    - Configuration initiale à partir de zéro
    - Vous voulez le chemin le plus rapide vers un chat fonctionnel
summary: Installez OpenClaw et lancez votre première conversation en quelques minutes.
title: Premiers pas
x-i18n:
    generated_at: "2026-05-07T13:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

Installez OpenClaw, exécutez l’onboarding et discutez avec votre assistant IA — le tout en
environ 5 minutes. À la fin, vous aurez un Gateway en cours d’exécution, une authentification configurée
et une session de chat fonctionnelle.

## Ce dont vous avez besoin

- **Node.js** — Node 24 recommandé (Node 22.16+ également pris en charge)
- **Une clé API** d’un fournisseur de modèles (Anthropic, OpenAI, Google, etc.) — l’onboarding vous la demandera

<Tip>
Vérifiez votre version de Node avec `node --version`.
**Utilisateurs Windows :** Windows natif et WSL2 sont tous deux pris en charge. WSL2 est plus
stable et recommandé pour l’expérience complète. Consultez [Windows](/fr/platforms/windows).
Besoin d’installer Node ? Consultez [Configuration de Node](/fr/install/node).
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
    Autres méthodes d’installation (Docker, Nix, npm) : [Installer](/fr/install).
    </Note>

  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide dans le choix d’un fournisseur de modèles, la définition d’une clé API
    et la configuration du Gateway. Cela prend environ 2 minutes.

    Consultez [Onboarding (CLI)](/fr/start/wizard) pour la référence complète.

  </Step>
  <Step title="Vérifier que le Gateway est en cours d’exécution">
    ```bash
    openclaw gateway status
    ```

    Vous devriez voir le Gateway à l’écoute sur le port 18789.

  </Step>
  <Step title="Ouvrir le tableau de bord">
    ```bash
    openclaw dashboard
    ```

    Cela ouvre l’interface de contrôle dans votre navigateur. Si elle se charge, tout fonctionne.

  </Step>
  <Step title="Envoyer votre premier message">
    Saisissez un message dans le chat de l’interface de contrôle et vous devriez recevoir une réponse de l’IA.

    Vous voulez plutôt discuter depuis votre téléphone ? Le canal le plus rapide à configurer est
    [Telegram](/fr/channels/telegram) (juste un jeton de bot). Consultez [Canaux](/fr/channels)
    pour toutes les options.

  </Step>
</Steps>

<Accordion title="Avancé : monter une version personnalisée de l’interface de contrôle">
  Si vous maintenez une version localisée ou personnalisée du tableau de bord, faites pointer
  `gateway.controlUi.root` vers un répertoire contenant vos ressources statiques générées
  et `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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

## Que faire ensuite

<Columns>
  <Card title="Connecter un canal" href="/fr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, et plus encore.
  </Card>
  <Card title="Appairage et sécurité" href="/fr/channels/pairing" icon="shield">
    Contrôlez qui peut envoyer des messages à votre agent.
  </Card>
  <Card title="Configurer le Gateway" href="/fr/gateway/configuration" icon="settings">
    Modèles, outils, bac à sable et paramètres avancés.
  </Card>
  <Card title="Parcourir les outils" href="/fr/tools" icon="wrench">
    Navigateur, exec, recherche web, Skills et plugins.
  </Card>
</Columns>

<Accordion title="Avancé : variables d’environnement">
  Si vous exécutez OpenClaw avec un compte de service ou si vous voulez des chemins personnalisés :

- `OPENCLAW_HOME` — répertoire personnel pour la résolution des chemins internes
- `OPENCLAW_STATE_DIR` — remplace le répertoire d’état
- `OPENCLAW_CONFIG_PATH` — remplace le chemin du fichier de configuration

Référence complète : [Variables d’environnement](/fr/help/environment).
</Accordion>

## Associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Vue d’ensemble des canaux](/fr/channels)
- [Configuration](/fr/start/setup)
