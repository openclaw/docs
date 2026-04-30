---
read_when:
    - Vous devez expliquer l’espace de travail de l’agent ou l’organisation de ses fichiers
    - Vous voulez sauvegarder ou migrer un espace de travail d’agent
sidebarTitle: Agent workspace
summary: 'Espace de travail de l’agent : emplacement, organisation et stratégie de sauvegarde'
title: Espace de travail de l’agent
x-i18n:
    generated_at: "2026-04-30T20:05:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

L’espace de travail est le domicile de l’agent. C’est le seul répertoire de travail utilisé pour les outils de fichiers et pour le contexte de l’espace de travail. Gardez-le privé et traitez-le comme de la mémoire.

Il est distinct de `~/.openclaw/`, qui stocke la configuration, les identifiants et les sessions.

<Warning>
L’espace de travail est le **cwd par défaut**, pas un bac à sable strict. Les outils résolvent les chemins relatifs par rapport à l’espace de travail, mais les chemins absolus peuvent toujours atteindre d’autres emplacements sur l’hôte, sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez [`agents.defaults.sandbox`](/fr/gateway/sandboxing) (et/ou une configuration de bac à sable par agent).

Quand le sandboxing est activé et que `workspaceAccess` n’est pas `"rw"`, les outils fonctionnent dans un espace de travail de bac à sable sous `~/.openclaw/sandboxes`, pas dans votre espace de travail hôte.
</Warning>

## Emplacement par défaut

- Par défaut : `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` est défini et n’est pas `"default"`, la valeur par défaut devient `~/.openclaw/workspace-<profile>`.
- Remplacer dans `~/.openclaw/openclaw.json` :

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` créeront l’espace de travail et ajouteront les fichiers d’amorçage s’ils sont manquants.

<Note>
Les copies initiales de bac à sable n’acceptent que les fichiers réguliers situés dans l’espace de travail ; les alias de liens symboliques/liens physiques qui se résolvent en dehors de l’espace de travail source sont ignorés.
</Note>

Si vous gérez déjà vous-même les fichiers de l’espace de travail, vous pouvez désactiver la création des fichiers d’amorçage :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dossiers d’espace de travail supplémentaires

Les anciennes installations ont pu créer `~/openclaw`. Conserver plusieurs répertoires d’espace de travail peut entraîner une dérive confuse de l’authentification ou de l’état, car un seul espace de travail est actif à la fois.

<Note>
**Recommandation :** conservez un seul espace de travail actif. Si vous n’utilisez plus les dossiers supplémentaires, archivez-les ou déplacez-les vers la corbeille (par exemple `trash ~/openclaw`). Si vous conservez volontairement plusieurs espaces de travail, assurez-vous que `agents.defaults.workspace` pointe vers celui qui est actif.

`openclaw doctor` avertit lorsqu’il détecte des répertoires d’espace de travail supplémentaires.
</Note>

## Carte des fichiers de l’espace de travail

Voici les fichiers standard qu’OpenClaw attend dans l’espace de travail :

<AccordionGroup>
  <Accordion title="AGENTS.md — instructions d’exploitation">
    Instructions d’exploitation pour l’agent et la façon dont il doit utiliser la mémoire. Chargées au début de chaque session. Bon emplacement pour les règles, priorités et détails sur « comment se comporter ».
  </Accordion>
  <Accordion title="SOUL.md — personnalité et ton">
    Personnalité, ton et limites. Chargé à chaque session. Guide : [guide de personnalité SOUL.md](/fr/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — qui est l’utilisateur">
    Qui est l’utilisateur et comment s’adresser à lui. Chargé à chaque session.
  </Accordion>
  <Accordion title="IDENTITY.md — nom, style, emoji">
    Le nom, le style et l’emoji de l’agent. Créé/mis à jour pendant le rituel d’amorçage.
  </Accordion>
  <Accordion title="TOOLS.md — conventions des outils locaux">
    Notes sur vos outils locaux et conventions. Ne contrôle pas la disponibilité des outils ; il s’agit uniquement de conseils.
  </Accordion>
  <Accordion title="HEARTBEAT.md — checklist Heartbeat">
    Petite checklist facultative pour les exécutions Heartbeat. Gardez-la courte pour éviter de consommer des jetons.
  </Accordion>
  <Accordion title="BOOT.md — checklist de démarrage">
    Checklist de démarrage facultative exécutée automatiquement au redémarrage du Gateway (quand les [hooks internes](/fr/automation/hooks) sont activés). Gardez-la courte ; utilisez l’outil de message pour les envois sortants.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — rituel de première exécution">
    Rituel de première exécution unique. Créé uniquement pour un tout nouvel espace de travail. Supprimez-le une fois le rituel terminé.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — journal de mémoire quotidien">
    Journal de mémoire quotidien (un fichier par jour). Il est recommandé de lire aujourd’hui + hier au démarrage de la session.
  </Accordion>
  <Accordion title="MEMORY.md — mémoire long terme organisée (facultatif)">
    Mémoire long terme organisée. À charger uniquement dans la session principale privée (pas dans les contextes partagés/de groupe). Consultez [Mémoire](/fr/concepts/memory) pour le workflow et le vidage automatique de la mémoire.
  </Accordion>
  <Accordion title="skills/ — Skills d’espace de travail (facultatif)">
    Skills propres à l’espace de travail. Emplacement de Skills de priorité la plus élevée pour cet espace de travail. Remplace les Skills d’agent de projet, les Skills d’agent personnels, les Skills gérés, les Skills intégrés et `skills.load.extraDirs` en cas de conflit de noms.
  </Accordion>
  <Accordion title="canvas/ — fichiers d’interface utilisateur Canvas (facultatif)">
    Fichiers d’interface utilisateur Canvas pour les affichages de nœuds (par exemple `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si un fichier d’amorçage est manquant, OpenClaw injecte un marqueur « fichier manquant » dans la session et continue. Les gros fichiers d’amorçage sont tronqués lors de l’injection ; ajustez les limites avec `agents.defaults.bootstrapMaxChars` (par défaut : 12000) et `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). `openclaw setup` peut recréer les valeurs par défaut manquantes sans écraser les fichiers existants.
</Note>

## Ce qui n’est PAS dans l’espace de travail

Ces éléments se trouvent sous `~/.openclaw/` et ne doivent PAS être validés dans le dépôt de l’espace de travail :

- `~/.openclaw/openclaw.json` (configuration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profils d’authentification des modèles : OAuth + clés API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (compte d’exécution Codex par agent, configuration, Skills, plugins et état natif des fils)
- `~/.openclaw/credentials/` (état des canaux/fournisseurs plus données d’import OAuth héritées)
- `~/.openclaw/agents/<agentId>/sessions/` (transcriptions de session + métadonnées)
- `~/.openclaw/skills/` (Skills gérés)

Si vous devez migrer des sessions ou la configuration, copiez-les séparément et gardez-les hors du contrôle de version.

## Sauvegarde Git (recommandée, privée)

Traitez l’espace de travail comme une mémoire privée. Placez-le dans un dépôt git **privé** afin qu’il soit sauvegardé et récupérable.

Exécutez ces étapes sur la machine où le Gateway s’exécute (c’est là que l’espace de travail se trouve).

<Steps>
  <Step title="Initialiser le dépôt">
    Si git est installé, les tout nouveaux espaces de travail sont initialisés automatiquement. Si cet espace de travail n’est pas déjà un dépôt, exécutez :

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Ajouter un dépôt distant privé">
    <Tabs>
      <Tab title="Interface Web GitHub">
        1. Créez un nouveau dépôt **privé** sur GitHub.
        2. Ne l’initialisez pas avec un README (évite les conflits de fusion).
        3. Copiez l’URL distante HTTPS.
        4. Ajoutez le dépôt distant et poussez :

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Interface Web GitLab">
        1. Créez un nouveau dépôt **privé** sur GitLab.
        2. Ne l’initialisez pas avec un README (évite les conflits de fusion).
        3. Copiez l’URL distante HTTPS.
        4. Ajoutez le dépôt distant et poussez :

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Mises à jour continues">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Ne validez pas de secrets

<Warning>
Même dans un dépôt privé, évitez de stocker des secrets dans l’espace de travail :

- Clés API, jetons OAuth, mots de passe ou identifiants privés.
- Tout ce qui se trouve sous `~/.openclaw/`.
- Exports bruts de conversations ou pièces jointes sensibles.

Si vous devez stocker des références sensibles, utilisez des placeholders et conservez le vrai secret ailleurs (gestionnaire de mots de passe, variables d’environnement ou `~/.openclaw/`).
</Warning>

Modèle de départ `.gitignore` suggéré :

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Déplacer l’espace de travail vers une nouvelle machine

<Steps>
  <Step title="Cloner le dépôt">
    Clonez le dépôt vers le chemin souhaité (par défaut `~/.openclaw/workspace`).
  </Step>
  <Step title="Mettre à jour la configuration">
    Définissez `agents.defaults.workspace` sur ce chemin dans `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Ajouter les fichiers manquants">
    Exécutez `openclaw setup --workspace <path>` pour ajouter les fichiers manquants.
  </Step>
  <Step title="Copier les sessions (facultatif)">
    Si vous avez besoin des sessions, copiez séparément `~/.openclaw/agents/<agentId>/sessions/` depuis l’ancienne machine.
  </Step>
</Steps>

## Notes avancées

- Le routage multi-agent peut utiliser des espaces de travail différents par agent. Consultez [Routage des canaux](/fr/channels/channel-routing) pour la configuration du routage.
- Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent utiliser des espaces de travail de bac à sable par session sous `agents.defaults.sandbox.workspaceRoot`.

## Connexe

- [Heartbeat](/fr/gateway/heartbeat) — fichier d’espace de travail HEARTBEAT.md
- [Sandboxing](/fr/gateway/sandboxing) — accès à l’espace de travail dans les environnements sandboxés
- [Session](/fr/concepts/session) — chemins de stockage des sessions
- [Instructions permanentes](/fr/automation/standing-orders) — instructions persistantes dans les fichiers de l’espace de travail
