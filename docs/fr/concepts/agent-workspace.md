---
read_when:
    - Vous devez expliquer l’espace de travail de l’agent ou la structure de ses fichiers
    - Vous souhaitez sauvegarder ou migrer un espace de travail d’agent
sidebarTitle: Agent workspace
summary: 'Espace de travail de l’agent : emplacement, structure et stratégie de sauvegarde'
title: Espace de travail de l’agent
x-i18n:
    generated_at: "2026-04-26T11:26:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

L’espace de travail est la maison de l’agent. C’est le seul répertoire de travail utilisé pour les outils de fichiers et pour le contexte d’espace de travail. Gardez-le privé et traitez-le comme de la mémoire.

Ceci est distinct de `~/.openclaw/`, qui stocke la configuration, les identifiants et les sessions.

<Warning>
L’espace de travail est le **cwd par défaut**, pas un sandbox strict. Les outils résolvent les chemins relatifs par rapport à l’espace de travail, mais les chemins absolus peuvent toujours atteindre d’autres emplacements sur l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez [`agents.defaults.sandbox`](/fr/gateway/sandboxing) (et/ou une configuration de sandbox par agent).

Lorsque le sandboxing est activé et que `workspaceAccess` n’est pas `"rw"`, les outils opèrent dans un espace de travail sandbox sous `~/.openclaw/sandboxes`, et non dans votre espace de travail hôte.
</Warning>

## Emplacement par défaut

- Par défaut : `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` est défini et n’est pas `"default"`, la valeur par défaut devient `~/.openclaw/workspace-<profile>`.
- Remplacez-la dans `~/.openclaw/openclaw.json` :

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` créeront l’espace de travail et initialiseront les fichiers bootstrap s’ils sont absents.

<Note>
Les copies d’initialisation du sandbox n’acceptent que des fichiers ordinaires dans l’espace de travail ; les alias symlink/hardlink qui se résolvent en dehors de l’espace de travail source sont ignorés.
</Note>

Si vous gérez déjà vous-même les fichiers de l’espace de travail, vous pouvez désactiver la création des fichiers bootstrap :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dossiers supplémentaires d’espace de travail

Les anciennes installations peuvent avoir créé `~/openclaw`. Garder plusieurs répertoires d’espace de travail peut provoquer une dérive confuse de l’authentification ou de l’état, car un seul espace de travail est actif à la fois.

<Note>
**Recommandation :** gardez un seul espace de travail actif. Si vous n’utilisez plus les dossiers supplémentaires, archivez-les ou déplacez-les dans la corbeille (par exemple `trash ~/openclaw`). Si vous conservez intentionnellement plusieurs espaces de travail, assurez-vous que `agents.defaults.workspace` pointe vers celui qui est actif.

`openclaw doctor` avertit lorsqu’il détecte des répertoires d’espace de travail supplémentaires.
</Note>

## Carte des fichiers de l’espace de travail

Voici les fichiers standards qu’OpenClaw attend dans l’espace de travail :

<AccordionGroup>
  <Accordion title="AGENTS.md — instructions de fonctionnement">
    Instructions de fonctionnement pour l’agent et manière dont il doit utiliser la mémoire. Chargé au début de chaque session. Bon emplacement pour les règles, priorités et détails sur la manière de se comporter.
  </Accordion>
  <Accordion title="SOUL.md — persona et ton">
    Persona, ton et limites. Chargé à chaque session. Guide : [Guide de personnalité SOUL.md](/fr/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — qui est l’utilisateur">
    Qui est l’utilisateur et comment s’adresser à lui. Chargé à chaque session.
  </Accordion>
  <Accordion title="IDENTITY.md — nom, style, emoji">
    Nom, style et emoji de l’agent. Créé/mis à jour pendant le rituel bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — conventions des outils locaux">
    Notes sur vos outils locaux et conventions. Ne contrôle pas la disponibilité des outils ; c’est uniquement un guide.
  </Accordion>
  <Accordion title="HEARTBEAT.md — checklist Heartbeat">
    Petite checklist facultative pour les exécutions Heartbeat. Gardez-la courte pour éviter de consommer des tokens.
  </Accordion>
  <Accordion title="BOOT.md — checklist de démarrage">
    Checklist de démarrage facultative exécutée automatiquement au redémarrage de la Gateway (lorsque les [hooks internes](/fr/automation/hooks) sont activés). Gardez-la courte ; utilisez l’outil de message pour les envois sortants.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — rituel du premier lancement">
    Rituel unique du premier lancement. Créé uniquement pour un espace de travail entièrement neuf. Supprimez-le une fois le rituel terminé.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — journal mémoire quotidien">
    Journal mémoire quotidien (un fichier par jour). Il est recommandé de lire aujourd’hui + hier au démarrage de la session.
  </Accordion>
  <Accordion title="MEMORY.md — mémoire longue durée organisée (facultatif)">
    Mémoire longue durée organisée. À charger uniquement dans la session principale privée (pas dans les contextes partagés/de groupe). Voir [Mémoire](/fr/concepts/memory) pour le workflow et la purge mémoire automatique.
  </Accordion>
  <Accordion title="skills/ — Skills d’espace de travail (facultatif)">
    Skills spécifiques à l’espace de travail. Emplacement de Skills de priorité la plus élevée pour cet espace de travail. Remplace les Skills d’agent du projet, les Skills d’agent personnels, les Skills gérées, les Skills intégrées et `skills.load.extraDirs` en cas de conflit de nom.
  </Accordion>
  <Accordion title="canvas/ — fichiers d’interface Canvas (facultatif)">
    Fichiers d’interface Canvas pour les affichages de nœud (par exemple `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si un fichier bootstrap est absent, OpenClaw injecte un marqueur « fichier manquant » dans la session et continue. Les gros fichiers bootstrap sont tronqués lors de l’injection ; ajustez les limites avec `agents.defaults.bootstrapMaxChars` (par défaut : 12000) et `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). `openclaw setup` peut recréer les valeurs par défaut manquantes sans écraser les fichiers existants.
</Note>

## Ce qui n’est PAS dans l’espace de travail

Ces éléments se trouvent sous `~/.openclaw/` et ne doivent PAS être commités dans le dépôt de l’espace de travail :

- `~/.openclaw/openclaw.json` (configuration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profils d’authentification de modèle : OAuth + clés API)
- `~/.openclaw/credentials/` (état des canaux/fournisseurs plus données d’import OAuth héritées)
- `~/.openclaw/agents/<agentId>/sessions/` (transcriptions de session + métadonnées)
- `~/.openclaw/skills/` (Skills gérées)

Si vous devez migrer les sessions ou la configuration, copiez-les séparément et gardez-les hors du contrôle de version.

## Sauvegarde Git (recommandée, privée)

Traitez l’espace de travail comme une mémoire privée. Placez-le dans un dépôt git **privé** afin qu’il soit sauvegardé et récupérable.

Exécutez ces étapes sur la machine où la Gateway tourne (c’est là que se trouve l’espace de travail).

<Steps>
  <Step title="Initialiser le dépôt">
    Si git est installé, les espaces de travail entièrement neufs sont initialisés automatiquement. Si cet espace de travail n’est pas déjà un dépôt, exécutez :

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Ajouter l’espace de travail de l’agent"
    ```

  </Step>
  <Step title="Ajouter un dépôt distant privé">
    <Tabs>
      <Tab title="Interface web GitHub">
        1. Créez un nouveau dépôt **privé** sur GitHub.
        2. Ne l’initialisez pas avec un README (pour éviter les conflits de fusion).
        3. Copiez l’URL HTTPS du dépôt distant.
        4. Ajoutez le dépôt distant et poussez :

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
      <Tab title="Interface web GitLab">
        1. Créez un nouveau dépôt **privé** sur GitLab.
        2. Ne l’initialisez pas avec un README (pour éviter les conflits de fusion).
        3. Copiez l’URL HTTPS du dépôt distant.
        4. Ajoutez le dépôt distant et poussez :

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
    git commit -m "Mettre à jour la mémoire"
    git push
    ```
  </Step>
</Steps>

## Ne commitez pas de secrets

<Warning>
Même dans un dépôt privé, évitez de stocker des secrets dans l’espace de travail :

- Clés API, jetons OAuth, mots de passe ou identifiants privés.
- Tout ce qui se trouve sous `~/.openclaw/`.
- Exports bruts de discussions ou pièces jointes sensibles.

Si vous devez stocker des références sensibles, utilisez des espaces réservés et conservez le vrai secret ailleurs (gestionnaire de mots de passe, variables d’environnement ou `~/.openclaw/`).
</Warning>

Exemple de départ de `.gitignore` :

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
  <Step title="Initialiser les fichiers manquants">
    Exécutez `openclaw setup --workspace <path>` pour initialiser les fichiers manquants.
  </Step>
  <Step title="Copier les sessions (facultatif)">
    Si vous avez besoin des sessions, copiez `~/.openclaw/agents/<agentId>/sessions/` depuis l’ancienne machine séparément.
  </Step>
</Steps>

## Notes avancées

- Le routage multi-agent peut utiliser différents espaces de travail par agent. Voir [Routage de canal](/fr/channels/channel-routing) pour la configuration de routage.
- Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent utiliser des espaces de travail sandbox par session sous `agents.defaults.sandbox.workspaceRoot`.

## Liens connexes

- [Heartbeat](/fr/gateway/heartbeat) — fichier d’espace de travail HEARTBEAT.md
- [Sandboxing](/fr/gateway/sandboxing) — accès à l’espace de travail dans les environnements sandboxés
- [Session](/fr/concepts/session) — chemins de stockage de session
- [Standing orders](/fr/automation/standing-orders) — instructions persistantes dans les fichiers de l’espace de travail
