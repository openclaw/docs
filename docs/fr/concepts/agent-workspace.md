---
read_when:
    - Vous devez expliquer l’espace de travail de l’agent ou l’organisation de ses fichiers
    - Vous souhaitez sauvegarder ou migrer un espace de travail d’agent
sidebarTitle: Agent workspace
summary: 'Espace de travail de l’agent : emplacement, organisation et stratégie de sauvegarde'
title: Espace de travail de l’agent
x-i18n:
    generated_at: "2026-05-11T20:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

L’espace de travail est le domicile de l’agent. C’est le seul répertoire de travail utilisé pour les outils de fichiers et pour le contexte de l’espace de travail. Gardez-le privé et traitez-le comme de la mémoire.

Il est distinct de `~/.openclaw/`, qui stocke la configuration, les identifiants et les sessions.

<Warning>
L’espace de travail est le **cwd par défaut**, pas un sandbox strict. Les outils résolvent les chemins relatifs par rapport à l’espace de travail, mais les chemins absolus peuvent toujours atteindre d’autres emplacements sur l’hôte, sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez [`agents.defaults.sandbox`](/fr/gateway/sandboxing) (et/ou une configuration de sandbox par agent).

Lorsque le sandboxing est activé et que `workspaceAccess` n’est pas `"rw"`, les outils fonctionnent dans un espace de travail sandbox sous `~/.openclaw/sandboxes`, et non dans votre espace de travail hôte.
</Warning>

## Emplacement par défaut

- Par défaut : `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` est défini et n’est pas `"default"`, la valeur par défaut devient `~/.openclaw/workspace-<profile>`.
- Remplacement dans `~/.openclaw/openclaw.json` :

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` créeront l’espace de travail et amorceront les fichiers de démarrage s’ils sont absents.

<Note>
Les copies d’amorçage de sandbox acceptent uniquement les fichiers réguliers dans l’espace de travail ; les alias symlink/hardlink qui se résolvent en dehors de l’espace de travail source sont ignorés.
</Note>

Si vous gérez déjà vous-même les fichiers de l’espace de travail, vous pouvez désactiver la création des fichiers de démarrage :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dossiers d’espace de travail supplémentaires

Des installations plus anciennes peuvent avoir créé `~/openclaw`. Conserver plusieurs répertoires d’espace de travail peut entraîner une dérive déroutante de l’authentification ou de l’état, car un seul espace de travail est actif à la fois.

<Note>
**Recommandation :** conservez un seul espace de travail actif. Si vous n’utilisez plus les dossiers supplémentaires, archivez-les ou placez-les dans la corbeille (par exemple `trash ~/openclaw`). Si vous conservez intentionnellement plusieurs espaces de travail, assurez-vous que `agents.defaults.workspace` pointe vers celui qui est actif.

`openclaw doctor` avertit lorsqu’il détecte des répertoires d’espace de travail supplémentaires.
</Note>

## Carte des fichiers de l’espace de travail

Voici les fichiers standards qu’OpenClaw attend dans l’espace de travail :

<AccordionGroup>
  <Accordion title="AGENTS.md - instructions de fonctionnement">
    Instructions de fonctionnement pour l’agent et la manière dont il doit utiliser la mémoire. Chargées au début de chaque session. Bon emplacement pour les règles, les priorités et les détails de type « comment se comporter ».
  </Accordion>
  <Accordion title="SOUL.md - persona et ton">
    Persona, ton et limites. Chargé à chaque session. Guide : [guide de personnalité SOUL.md](/fr/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - identité de l’utilisateur">
    Qui est l’utilisateur et comment s’adresser à lui. Chargé à chaque session.
  </Accordion>
  <Accordion title="IDENTITY.md - nom, ambiance, emoji">
    Le nom, l’ambiance et l’emoji de l’agent. Créé/mis à jour pendant le rituel de démarrage.
  </Accordion>
  <Accordion title="TOOLS.md - conventions des outils locaux">
    Notes sur vos outils locaux et leurs conventions. Ne contrôle pas la disponibilité des outils ; il s’agit uniquement de conseils.
  </Accordion>
  <Accordion title="HEARTBEAT.md - liste de vérification Heartbeat">
    Petite liste de vérification facultative pour les exécutions Heartbeat. Gardez-la courte pour éviter la consommation de tokens.
  </Accordion>
  <Accordion title="BOOT.md - liste de vérification de démarrage">
    Liste de vérification de démarrage facultative exécutée automatiquement au redémarrage du Gateway (lorsque les [hooks internes](/fr/automation/hooks) sont activés). Gardez-la courte ; utilisez l’outil de message pour les envois sortants.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rituel de première exécution">
    Rituel unique de première exécution. Créé uniquement pour un tout nouvel espace de travail. Supprimez-le une fois le rituel terminé.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - journal de mémoire quotidien">
    Journal de mémoire quotidien (un fichier par jour). Il est recommandé de lire aujourd’hui + hier au démarrage de la session.
  </Accordion>
  <Accordion title="MEMORY.md - mémoire à long terme organisée (facultatif)">
    Mémoire à long terme organisée : faits durables, préférences, décisions et courts résumés. Conservez les journaux détaillés dans `memory/YYYY-MM-DD.md` afin que les outils de mémoire puissent les récupérer à la demande sans les injecter dans chaque prompt. Ne chargez `MEMORY.md` que dans la session principale privée (pas dans les contextes partagés/de groupe). Consultez [Mémoire](/fr/concepts/memory) pour le workflow et le vidage automatique de la mémoire.
  </Accordion>
  <Accordion title="skills/ - Skills d’espace de travail (facultatif)">
    Skills propres à l’espace de travail. Emplacement de Skill avec la priorité la plus élevée pour cet espace de travail. Remplace les Skills d’agent de projet, les Skills d’agent personnelles, les Skills gérées, les Skills intégrées et `skills.load.extraDirs` lorsque les noms entrent en collision.
  </Accordion>
  <Accordion title="canvas/ - fichiers d’interface Canvas (facultatif)">
    Fichiers d’interface Canvas pour les affichages de nœuds (par exemple `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si un fichier de démarrage est absent, OpenClaw injecte un marqueur « fichier manquant » dans la session et continue. Les gros fichiers de démarrage sont tronqués lorsqu’ils sont injectés ; ajustez les limites avec `agents.defaults.bootstrapMaxChars` (par défaut : 12000) et `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). `openclaw setup` peut recréer les valeurs par défaut manquantes sans écraser les fichiers existants.
</Note>

## Ce qui n’est PAS dans l’espace de travail

Ces éléments se trouvent sous `~/.openclaw/` et ne doivent PAS être commités dans le dépôt de l’espace de travail :

- `~/.openclaw/openclaw.json` (configuration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profils d’authentification de modèle : OAuth + clés API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (compte d’exécution Codex par agent, configuration, Skills, plugins et état de thread natif)
- `~/.openclaw/credentials/` (état des canaux/fournisseurs plus données d’import OAuth héritées)
- `~/.openclaw/agents/<agentId>/sessions/` (transcriptions de session + métadonnées)
- `~/.openclaw/skills/` (Skills gérées)

Si vous devez migrer des sessions ou une configuration, copiez-les séparément et gardez-les hors du contrôle de version.

## Sauvegarde Git (recommandée, privée)

Traitez l’espace de travail comme une mémoire privée. Placez-le dans un dépôt git **privé** afin qu’il soit sauvegardé et récupérable.

Exécutez ces étapes sur la machine où le Gateway s’exécute (c’est là que se trouve l’espace de travail).

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
      <Tab title="Interface web GitHub">
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
      <Tab title="Interface web GitLab">
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

## Ne commitez pas de secrets

<Warning>
Même dans un dépôt privé, évitez de stocker des secrets dans l’espace de travail :

- Clés API, tokens OAuth, mots de passe ou identifiants privés.
- Tout ce qui se trouve sous `~/.openclaw/`.
- Dumps bruts de conversations ou pièces jointes sensibles.

Si vous devez stocker des références sensibles, utilisez des placeholders et gardez le secret réel ailleurs (gestionnaire de mots de passe, variables d’environnement ou `~/.openclaw/`).
</Warning>

Début de `.gitignore` suggéré :

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
  <Step title="Amorcer les fichiers manquants">
    Exécutez `openclaw setup --workspace <path>` pour amorcer tous les fichiers manquants.
  </Step>
  <Step title="Copier les sessions (facultatif)">
    Si vous avez besoin des sessions, copiez séparément `~/.openclaw/agents/<agentId>/sessions/` depuis l’ancienne machine.
  </Step>
</Steps>

## Notes avancées

- Le routage multi-agent peut utiliser différents espaces de travail par agent. Consultez [Routage des canaux](/fr/channels/channel-routing) pour la configuration du routage.
- Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent utiliser des espaces de travail sandbox par session sous `agents.defaults.sandbox.workspaceRoot`.

## Connexe

- [Heartbeat](/fr/gateway/heartbeat) - fichier d’espace de travail HEARTBEAT.md
- [Sandboxing](/fr/gateway/sandboxing) - accès à l’espace de travail dans les environnements sandboxés
- [Session](/fr/concepts/session) - chemins de stockage des sessions
- [Ordres permanents](/fr/automation/standing-orders) - instructions persistantes dans les fichiers de l’espace de travail
